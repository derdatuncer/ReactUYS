const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// MySQL bağlantısı
const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', //şifre varsa buraya girilmeli
  database: process.env.DB_NAME || 'uni_yonetim'
});

// Veritabanı bağlantısı
connection.connect((err) => {
  if (err) {
    console.error('MySQL bağlantı hatası:', err);
    return;
  }
  console.log('MySQL veritabanına bağlandı.');
});

// Yardımcı fonksiyonlar
const getCurrentDonem = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  if (month >= 9 || month <= 1) return 'GUZ';
  if (month >= 2 && month <= 6) return 'BAHAR';
  return 'YAZ';
};

const executeTransaction = async (queries) => {
  return new Promise((resolve, reject) => {
    connection.beginTransaction(err => {
      if (err) return reject(err);

      let completedQueries = 0;
      let hasError = false;

      queries.forEach(({ query, params, onSuccess }) => {
        connection.query(query, params, (err, result) => {
          if (err) {
            hasError = true;
            return connection.rollback(() => reject(err));
          }

          if (onSuccess) onSuccess(result);
          completedQueries++;

          if (completedQueries === queries.length && !hasError) {
            connection.commit(err => {
              if (err) return connection.rollback(() => reject(err));
              resolve();
            });
          }
        });
      });
    });
  });
};

// API Endpoints
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend çalışıyor!' });
});

// Login endpointi
app.post('/api/login', async (req, res) => {
  const { kullanici_adi, sifre } = req.body;
  if (!kullanici_adi || !sifre) {
    return res.status(400).json({ message: 'Kullanıcı adı ve şifre gerekli.' });
  }

  try {
    const [results] = await connection.promise().query(
      'SELECT kullanici_id, rol, kullanici_adi FROM kullanici WHERE kullanici_adi = ? AND sifre = ?',
      [kullanici_adi, sifre]
    );

    if (results.length === 0) {
      return res.status(401).json({ message: 'Kullanıcı adı veya şifre hatalı.' });
    }

    res.json(results[0]);
  } catch (error) {
    res.status(500).json({ message: 'Veritabanı hatası.' });
  }
});

// Admin dashboard istatistikleri
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    const queries = {
      ogrenciSayisi: 'SELECT COUNT(*) as count FROM ogrenci',
      ogretimUyesiSayisi: 'SELECT COUNT(*) as count FROM ogretim_uyesi',
      bolumSayisi: 'SELECT COUNT(*) as count FROM bolum',
      dersSayisi: 'SELECT COUNT(*) as count FROM ders',
      aktifOgrenciSayisi: 'SELECT COUNT(*) as count FROM ogrenci WHERE statu = "aktif"'
    };

    const results = {};
    for (const [key, query] of Object.entries(queries)) {
      const [result] = await connection.promise().query(query);
      results[key] = result[0].count;
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Veritabanı hatası.' });
  }
});

// Öğrenci işlemleri
app.post('/api/ogrenci/ekle', async (req, res) => {
  const { ogrenci_no, ad, soyad, e_posta, telefon, sinif, bolum_id } = req.body;
  
  try {
    // Önce bölümdeki öğretim üyelerini bul
    const [ogretimUyeleri] = await connection.promise().query(
      'SELECT ogretmen_id FROM ogretim_uyesi WHERE bolum_id = ?',
      [bolum_id]
    );

    if (ogretimUyeleri.length === 0) {
      return res.status(400).json({ message: 'Bu bölümde henüz öğretim üyesi bulunmamaktadır.' });
    }

    // Rastgele bir öğretim üyesi seç
    const randomIndex = Math.floor(Math.random() * ogretimUyeleri.length);
    const danismanId = ogretimUyeleri[randomIndex].ogretmen_id;

    await executeTransaction([
      {
        query: 'INSERT INTO ogrenci (ogrenci_no, ad, soyad, e_posta, telefon, sinif, bolum_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        params: [ogrenci_no, ad, soyad, e_posta, telefon, sinif, bolum_id]
      },
      {
        query: 'INSERT INTO kullanici (kullanici_adi, sifre, rol) VALUES (?, ?, ?)',
        params: [`${ogrenci_no}@ogr`, ogrenci_no, 'ogrenci']
      },
      {
        query: 'INSERT INTO danismanlik (ogrenci_no, ogretmen_id) VALUES (?, ?)',
        params: [ogrenci_no, danismanId]
      }
    ]);

    res.json({ 
      message: 'Öğrenci ve kullanıcı hesabı başarıyla oluşturuldu.', 
      ogrenci_no,
      kullanici_adi: `${ogrenci_no}@ogr`
    });
  } catch (error) {
    res.status(500).json({ message: 'İşlem sırasında bir hata oluştu.' });
  }
});

app.get('/api/ogrenci/liste', (req, res) => {
  const query = `
    SELECT 
      o.*,
      b.ad as bolum_adi,
      v.veli_id,
      v.ad as veli_ad,
      v.soyad as veli_soyad,
      v.telefon as veli_telefon,
      v.e_posta as veli_e_posta
    FROM ogrenci o 
    LEFT JOIN bolum b ON o.bolum_id = b.bolum_id
    LEFT JOIN veli_ogrenci vo ON o.ogrenci_no = vo.ogrenci_no
    LEFT JOIN veli v ON vo.veli_id = v.veli_id
    ORDER BY o.ogrenci_no
  `;
  
  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Öğrenci listesi alınırken hata oluştu.' });
    }
    res.json(results);
  });
});

app.get('/api/bolumler', (req, res) => {
  const query = 'SELECT bolum_id, ad FROM bolum';
  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Bölüm listesi alınırken hata oluştu.' });
    }
    res.json(results);
  });
});

// Öğrenci güncelleme endpoint'i
app.put('/api/ogrenci/guncelle/:ogrenci_no', (req, res) => {
  const { ogrenci_no } = req.params;
  const { ad, soyad, e_posta, telefon, sinif, bolum_id, statu } = req.body;
  
  // Transaction başlat
  connection.beginTransaction(err => {
    if (err) {
      return res.status(500).json({ message: 'İşlem başlatılırken hata oluştu.' });
    }

    // Öğrenciyi güncelle
    const ogrenciQuery = 'UPDATE ogrenci SET ad = ?, soyad = ?, e_posta = ?, telefon = ?, sinif = ?, bolum_id = ?, statu = ? WHERE ogrenci_no = ?';
    connection.query(ogrenciQuery, [ad, soyad, e_posta, telefon, sinif, bolum_id, statu, ogrenci_no], (err, result) => {
      if (err) {
        return connection.rollback(() => {
          res.status(500).json({ message: 'Öğrenci güncellenirken hata oluştu.' });
        });
      }

      // Kullanıcı adını güncelle
      const eskiKullaniciAdi = `${req.body.eski_ad?.toLowerCase().replace(/\s+/g, '.')}.${req.body.eski_soyad?.toLowerCase().replace(/\s+/g, '.')}@ogr`;
      const yeniKullaniciAdi = `${ad.toLowerCase().replace(/\s+/g, '.')}.${soyad.toLowerCase().replace(/\s+/g, '.')}@ogr`;
      
      const kullaniciQuery = 'UPDATE kullanici SET kullanici_adi = ? WHERE kullanici_adi = ?';
      connection.query(kullaniciQuery, [yeniKullaniciAdi, eskiKullaniciAdi], (err, result) => {
        if (err) {
          return connection.rollback(() => {
            res.status(500).json({ message: 'Kullanıcı adı güncellenirken hata oluştu.' });
          });
        }

        // Transaction'ı tamamla
        connection.commit(err => {
          if (err) {
            return connection.rollback(() => {
              res.status(500).json({ message: 'İşlem tamamlanırken hata oluştu.' });
            });
          }
          res.json({ 
            message: 'Öğrenci ve kullanıcı adı başarıyla güncellendi.',
            yeni_kullanici_adi: yeniKullaniciAdi
          });
        });
      });
    });
  });
});

// Öğrenci silme endpoint'i
app.delete('/api/ogrenci/sil/:ogrenci_no', (req, res) => {
  const { ogrenci_no } = req.params;
  
  // Önce öğrenci bilgilerini al
  const getOgrenciQuery = 'SELECT ad, soyad FROM ogrenci WHERE ogrenci_no = ?';
  connection.query(getOgrenciQuery, [ogrenci_no], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Öğrenci bilgileri alınırken hata oluştu.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı.' });
    }

    const { ad, soyad } = results[0];
    const kullanici_adi = `${ad.toLowerCase().replace(/\s+/g, '.')}.${soyad.toLowerCase()}@ogr`;

    // Transaction başlat
    connection.beginTransaction(err => {
      if (err) {
        return res.status(500).json({ message: 'İşlem başlatılırken hata oluştu.' });
      }

      // İlişkili kayıtları sil
      const queries = [
        'DELETE FROM ders_kaydi WHERE ogrenci_no = ?',
        'DELETE FROM danismanlik WHERE ogrenci_no = ?',
        'DELETE FROM veli_ogrenci WHERE ogrenci_no = ?',
        'DELETE FROM kullanici WHERE kullanici_adi = ?',
        'DELETE FROM ogrenci WHERE ogrenci_no = ?'
      ];

      let completedQueries = 0;
      let hasError = false;

      queries.forEach(query => {
        connection.query(query, [ogrenci_no, ogrenci_no, ogrenci_no, kullanici_adi, ogrenci_no], (err, result) => {
          if (err) {
            hasError = true;
            return connection.rollback(() => {
              res.status(500).json({ message: 'Kayıtlar silinirken hata oluştu.' });
            });
          }

          completedQueries++;
          if (completedQueries === queries.length && !hasError) {
            connection.commit(err => {
              if (err) {
                return connection.rollback(() => {
                  res.status(500).json({ message: 'İşlem tamamlanırken hata oluştu.' });
                });
              }
              res.json({ message: 'Öğrenci ve ilgili tüm kayıtlar başarıyla silindi.' });
            });
          }
        });
      });
    });
  });
});

// Öğretim üyesi işlemleri
app.get('/api/ogretim-uyesi/liste', (req, res) => {
  const query = `
    SELECT 
      ou.*,
      b.ad as bolum_adi,
      GROUP_CONCAT(d.ders_kodu) as ders_kodlari,
      GROUP_CONCAT(d.ad) as ders_adi
    FROM ogretim_uyesi ou
    LEFT JOIN bolum b ON ou.bolum_id = b.bolum_id
    LEFT JOIN ders_verme dv ON ou.ogretmen_id = dv.ogretmen_id
    LEFT JOIN ders d ON dv.ders_kodu = d.ders_kodu
    GROUP BY ou.ogretmen_id
    ORDER BY ou.ogretmen_id
  `;
  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Öğretim üyesi listesi alınırken hata oluştu.' });
    }
    res.json(results);
  });
});

app.post('/api/ogretim-uyesi/ekle', async (req, res) => {
  const { ad, soyad, e_posta, unvan, bolum_id, dersler } = req.body;
  
  if (!ad || !soyad || !e_posta || !unvan || !bolum_id) {
    return res.status(400).json({ message: 'Tüm alanlar zorunludur.' });
  }

  try {
    const [result] = await connection.promise().query(
      'INSERT INTO ogretim_uyesi (ad, soyad, e_posta, unvan, bolum_id) VALUES (?, ?, ?, ?, ?)',
      [ad, soyad, e_posta, unvan, bolum_id]
    );

    const ogretmenId = result.insertId;
    const kullaniciAdi = `${ogretmenId}@akademi`;

    await executeTransaction([
      {
        query: 'INSERT INTO kullanici (kullanici_adi, sifre, rol) VALUES (?, ?, ?)',
        params: [kullaniciAdi, ogretmenId.toString(), 'ogretim_gorevlisi']
      },
      ...(dersler?.length ? dersler.map(ders_kodu => ({
        query: 'INSERT INTO ders_verme (ogretmen_id, ders_kodu) VALUES (?, ?)',
        params: [ogretmenId, ders_kodu]
      })) : [])
    ]);

    res.json({ 
      message: 'Öğretim üyesi ve kullanıcı hesabı başarıyla oluşturuldu.',
      ogretmen_id: ogretmenId,
      kullanici_adi: kullaniciAdi
    });
  } catch (error) {
    res.status(500).json({ message: 'İşlem sırasında bir hata oluştu.' });
  }
});

app.put('/api/ogretim-uyesi/guncelle/:ogretmen_id', (req, res) => {
  const { ogretmen_id } = req.params;
  const { ad, soyad, e_posta, unvan, bolum_id, dersler } = req.body;
  
  connection.beginTransaction(err => {
    if (err) {
      return res.status(500).json({ message: 'İşlem başlatılırken hata oluştu.' });
    }

    const ogretimUyesiQuery = 'UPDATE ogretim_uyesi SET ad = ?, soyad = ?, e_posta = ?, unvan = ?, bolum_id = ? WHERE ogretmen_id = ?';
    connection.query(ogretimUyesiQuery, [ad, soyad, e_posta, unvan, bolum_id, ogretmen_id], (err, result) => {
      if (err) {
        return connection.rollback(() => {
          res.status(500).json({ message: 'Öğretim üyesi güncellenirken hata oluştu.' });
        });
      }

      const yeniKullaniciAdi = `${ogretmen_id}@akademi`;
      
      const kullaniciQuery = 'UPDATE kullanici SET kullanici_adi = ? WHERE kullanici_adi LIKE ?';
      connection.query(kullaniciQuery, [yeniKullaniciAdi, `%@akademi`], (err, result) => {
        if (err) {
          return connection.rollback(() => {
            res.status(500).json({ message: 'Kullanıcı adı güncellenirken hata oluştu.' });
          });
        }

        // Mevcut dersleri sil
        connection.query('DELETE FROM ders_verme WHERE ogretmen_id = ?', [ogretmen_id], (err, result) => {
          if (err) {  
            return connection.rollback(() => {
              res.status(500).json({ message: 'Mevcut dersler silinirken hata oluştu.' });
            });
          }

          // Yeni dersleri ekle
          if (dersler && dersler.length > 0) {
            const dersVermeQueries = dersler.map(ders_kodu => {
              return new Promise((resolve, reject) => {
                connection.query(
                  'INSERT INTO ders_verme (ogretmen_id, ders_kodu) VALUES (?, ?)',
                  [ogretmen_id, ders_kodu],
                  (err, result) => {
                    if (err) reject(err);
                    else resolve(result);
                  }
                );
              });
            });

            Promise.all(dersVermeQueries)
              .then(() => {
                connection.commit(err => {
                  if (err) {  
                    return connection.rollback(() => {
                      res.status(500).json({ message: 'İşlem tamamlanırken hata oluştu.' });
                    });
                  }
                  res.json({ 
                    message: 'Öğretim üyesi, kullanıcı adı ve dersler başarıyla güncellendi.',
                    yeni_kullanici_adi: yeniKullaniciAdi
                  });
                });
              })
              .catch(err => {
                return connection.rollback(() => {
                  res.status(500).json({ message: 'Dersler atanırken hata oluştu.' });
                });
              });
          } else {
            connection.commit(err => {
              if (err) {
                return connection.rollback(() => {
                  res.status(500).json({ message: 'İşlem tamamlanırken hata oluştu.' });
                });
              }
              res.json({ 
                message: 'Öğretim üyesi ve kullanıcı adı başarıyla güncellendi.',
                yeni_kullanici_adi: yeniKullaniciAdi
              });
            });
          }
        });
      });
    });
  });
});

app.delete('/api/ogretim-uyesi/sil/:ogretmen_id', (req, res) => {
  const { ogretmen_id } = req.params;
  const kullanici_adi = `${ogretmen_id}@akademi`;

  connection.beginTransaction(err => {
    if (err) {
      return res.status(500).json({ message: 'İşlem başlatılırken hata oluştu.' });
    }

    const queries = [
      'DELETE FROM ders_verme WHERE ogretmen_id = ?',
      'DELETE FROM danismanlik WHERE ogretmen_id = ?',
      'DELETE FROM kullanici WHERE kullanici_adi = ?',
      'DELETE FROM ogretim_uyesi WHERE ogretmen_id = ?'
    ];

    let completedQueries = 0;
    let hasError = false;

    queries.forEach(query => {
      connection.query(query, [ogretmen_id, ogretmen_id, kullanici_adi, ogretmen_id], (err, result) => {
        if (err) {
          hasError = true;
          return connection.rollback(() => {
            res.status(500).json({ message: 'Kayıtlar silinirken hata oluştu.' });
          });
        }

        completedQueries++;
        if (completedQueries === queries.length && !hasError) {
          connection.commit(err => {
            if (err) {
              return connection.rollback(() => {
                res.status(500).json({ message: 'İşlem tamamlanırken hata oluştu.' });
              });
            }
            res.json({ message: 'Öğretim üyesi ve ilgili tüm kayıtlar başarıyla silindi.' });
          });
        }
      });
    });
  });
});

// Ders işlemleri
app.post('/api/ders/ekle', (req, res) => {
  const { ders_kodu, ad, kredi, bolum_id, donem, zorunlu_mu } = req.body;
  
  // Veri doğrulama
  if (!ders_kodu || !ad || !kredi || !bolum_id || !donem) {
    return res.status(400).json({ message: 'Tüm alanlar zorunludur.' });
  }

  // Dersi ekle
  const dersQuery = 'INSERT INTO ders (ders_kodu, ad, kredi, bolum_id, donem, zorunlu_mu) VALUES (?, ?, ?, ?, ?, ?)';
  
  connection.query(dersQuery, [ders_kodu, ad, kredi, bolum_id, donem, zorunlu_mu || false], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Ders eklenirken hata oluştu: ' + err.message });
    }
    res.json({ 
      message: 'Ders başarıyla eklendi.',
      ders_kodu: result.insertId
    });
  });
});

app.get('/api/ders/liste', (req, res) => {
  const query = `
    SELECT d.*, b.ad as bolum_adi
    FROM ders d
    LEFT JOIN bolum b ON d.bolum_id = b.bolum_id
    ORDER BY d.ders_kodu
  `;
  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Ders listesi alınırken hata oluştu.' });
    }
    res.json(results);
  });
});

// Ders düzenleme endpoint'i
app.put('/api/ders/guncelle/:ders_kodu', (req, res) => {
  const { ders_kodu } = req.params;
  const { ad, kredi, bolum_id, donem, zorunlu_mu } = req.body;
  
  // Veri doğrulama
  if (!ad || !kredi || !bolum_id || !donem) {
    return res.status(400).json({ message: 'Tüm alanlar zorunludur.' });
  }

  const dersQuery = 'UPDATE ders SET ad = ?, kredi = ?, bolum_id = ?, donem = ?, zorunlu_mu = ? WHERE ders_kodu = ?';
  connection.query(dersQuery, [ad, kredi, bolum_id, donem, zorunlu_mu || false, ders_kodu], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Ders güncellenirken hata oluştu: ' + err.message });
    }
    res.json({ 
      message: 'Ders başarıyla güncellendi.',
      ders_kodu
    });
  });
});

// Ders silme endpoint'i
app.delete('/api/ders/sil/:ders_kodu', (req, res) => {
  const { ders_kodu } = req.params;
  
  connection.beginTransaction(err => {
    if (err) {
      return res.status(500).json({ message: 'İşlem başlatılırken hata oluştu.' });
    }

    // İlişkili kayıtları sil
    const queries = [
      'DELETE FROM ders_kaydi WHERE ders_kodu = ?',
      'DELETE FROM ders_verme WHERE ders_kodu = ?',
      'DELETE FROM ders WHERE ders_kodu = ?'
    ];

    let completedQueries = 0;
    let hasError = false;

    queries.forEach(query => {
      connection.query(query, [ders_kodu, ders_kodu, ders_kodu], (err, result) => {
        if (err) {
          hasError = true;
          return connection.rollback(() => {
            res.status(500).json({ message: 'Kayıtlar silinirken hata oluştu.' });
          });
        }

        completedQueries++;
        if (completedQueries === queries.length && !hasError) {
          connection.commit(err => {
            if (err) {
              return connection.rollback(() => {
                res.status(500).json({ message: 'İşlem tamamlanırken hata oluştu.' });
              });
            }
            res.json({ message: 'Ders ve ilgili tüm kayıtlar başarıyla silindi.' });
          });
        }
      });
    });
  });
});

// Bölüm ekleme endpoint'i
app.post('/api/bolum/ekle', (req, res) => {
  const { ad, fakulte } = req.body;
  
  // Bölüm adının benzersiz olduğunu kontrol et
  connection.query(
    'SELECT * FROM bolum WHERE ad = ?',
    [ad],
    (err, existingBolum) => {
      if (err) {
        return res.status(500).json({ message: 'Bölüm kontrolü sırasında hata oluştu.' });
      }

      if (existingBolum.length > 0) {
        return res.status(400).json({ message: 'Bu bölüm adı zaten kullanılıyor.' });
      }

      // Yeni bölümü ekle
      connection.query(
        'INSERT INTO bolum (ad, fakulte) VALUES (?, ?)',
        [ad, fakulte],
        (err, result) => {
          if (err) {
            return res.status(500).json({ message: 'Bölüm eklenirken bir hata oluştu.' });
          }

          res.status(201).json({ 
            message: 'Bölüm başarıyla eklendi.',
            bolumId: result.insertId 
          });
        }
      );
    }
  );
});

// Bölüm listeleme endpoint'i
app.get('/api/bolum/liste', (req, res) => {
  const query = 'SELECT * FROM bolum ORDER BY ad';
  connection.query(query, (err, results) => {
    if (err) {  
      return res.status(500).json({ message: 'Bölüm listesi alınırken hata oluştu.' });
    }
    res.json(results);
  });
});

// Bölüm silme endpoint'i
app.delete('/api/bolum/sil/:bolum_id', (req, res) => {
  const { bolum_id } = req.params;
  
  connection.beginTransaction(err => {
    if (err) {
      return res.status(500).json({ message: 'İşlem başlatılırken hata oluştu.' });
    }

    // İlişkili kayıtları kontrol et
    const checkQueries = [
      'SELECT COUNT(*) as count FROM ogrenci WHERE bolum_id = ?',
      'SELECT COUNT(*) as count FROM ogretim_uyesi WHERE bolum_id = ?',
      'SELECT COUNT(*) as count FROM ders WHERE bolum_id = ?'
    ];

    let completedChecks = 0;
    let hasError = false;
    let hasRelatedRecords = false;

    checkQueries.forEach(query => {
      connection.query(query, [bolum_id], (err, results) => {
        if (err) {
          hasError = true;
          return connection.rollback(() => {
            res.status(500).json({ message: 'İlişkili kayıtlar kontrol edilirken hata oluştu.' });
          });
        }

        if (results[0].count > 0) {
          hasRelatedRecords = true;
        }

        completedChecks++;
        if (completedChecks === checkQueries.length) {
          if (hasRelatedRecords) {
            return connection.rollback(() => {
              res.status(400).json({ 
                message: 'Bu bölüme bağlı öğrenci, öğretim üyesi veya ders bulunduğu için silinemez.' 
              });
            });
          }

          // İlişkili kayıt yoksa bölümü sil
          connection.query('DELETE FROM bolum WHERE bolum_id = ?', [bolum_id], (err, result) => {
            if (err) {
              return connection.rollback(() => {
                res.status(500).json({ message: 'Bölüm silinirken hata oluştu.' });
              });
            }

            connection.commit(err => {
              if (err) {
                return connection.rollback(() => {
                  res.status(500).json({ message: 'İşlem tamamlanırken hata oluştu.' });
                });
              }
              res.json({ message: 'Bölüm başarıyla silindi.' });
            });
          });
        }
      });
    });
  });
});

// Bölüm güncelleme endpoint'i
app.put('/api/bolum/guncelle/:bolum_id', (req, res) => {
  const { bolum_id } = req.params;
  const { ad, fakulte } = req.body;
  
  // Bölüm adının benzersiz olduğunu kontrol et (kendi ID'si hariç)
  connection.query(
    'SELECT * FROM bolum WHERE ad = ? AND bolum_id != ?',
    [ad, bolum_id],
    (err, existingBolum) => {
      if (err) {  
        return res.status(500).json({ message: 'Bölüm kontrolü sırasında hata oluştu.' });
      }

      if (existingBolum.length > 0) {
        return res.status(400).json({ message: 'Bu bölüm adı zaten kullanılıyor.' });
      }

      // Bölümü güncelle
      connection.query(
        'UPDATE bolum SET ad = ?, fakulte = ? WHERE bolum_id = ?',
        [ad, fakulte, bolum_id],
        (err, result) => {
          if (err) {
            return res.status(500).json({ message: 'Bölüm güncellenirken bir hata oluştu.' });
          }

          res.json({ 
            message: 'Bölüm başarıyla güncellendi.',
            bolumId: bolum_id 
          });
        }
      );
    }
  );
});

// Derslik listesi endpoint'i
app.get('/api/derslik/liste', (req, res) => {
  const query = 'SELECT * FROM derslik ORDER BY bina, kat, derslik_id';
  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Derslik listesi alınırken hata oluştu.' });
    }
    res.json(results);
  });
});

// Bölümlere göre ders programı oluşturma endpoint'i
app.post('/api/ders-programi/olustur/:bolum_id', async (req, res) => {
  const { bolum_id } = req.params;
  const currentDonem = getCurrentDonem();
  
  try {
    // 1. Bölümün derslerini al (sadece mevcut dönem için)
    const derslerQuery = `
      SELECT d.*, dv.ogretmen_id 
      FROM ders d
      LEFT JOIN ders_verme dv ON d.ders_kodu = dv.ders_kodu
      WHERE d.bolum_id = ? AND d.donem = ?
    `;
    
    const [dersler] = await connection.promise().query(derslerQuery, [bolum_id, currentDonem]);
    
    if (dersler.length === 0) {
      return res.status(400).json({ 
        message: `Bu dönem (${currentDonem}) için kayıtlı ders bulunamadı.` 
      });
    }

    // 2. Mevcut derslikleri al
    const [derslikler] = await connection.promise().query('SELECT * FROM derslik');
    
    // 3. Mevcut programı temizle (aynı bölümün dersleri için)
    await connection.promise().query(
      'DELETE FROM islenme WHERE ders_kodu IN (SELECT ders_kodu FROM ders WHERE bolum_id = ?)',
      [bolum_id]
    );

    // 4. Program oluşturma kısıtlamaları
    const gunler = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
    const saatler = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];
    
    // 5. Her ders için günlük ders sayısını takip et
    const gunlukDersSayisi = {};
    gunler.forEach(gun => {
      gunlukDersSayisi[gun] = 0;
    });

    // 6. Her ders için uygun slot bul
    for (const ders of dersler) {
      let dersProgramlandi = false;
      
      // Günleri ders sayısına göre sırala (en az ders olan günler önce)
      const siraliGunler = [...gunler].sort((a, b) => 
        gunlukDersSayisi[a] - gunlukDersSayisi[b]
      );
      
      // Her ders için tüm olası kombinasyonları dene
      for (const gun of siraliGunler) {
        if (dersProgramlandi) break;
        
        for (const saat of saatler) {
          if (dersProgramlandi) break;
          
          // Bu slot için derslik kontrolü
          for (const derslik of derslikler) {
            // 1. Derslik müsait mi?
            const [derslikMevcut] = await connection.promise().query(
              'SELECT * FROM islenme WHERE derslik_id = ? AND gun = ? AND saat = ?',
              [derslik.derslik_id, gun, saat]
            );
            
            if (derslikMevcut.length > 0) continue;
            
            // 2. Öğretmen müsait mi?
            if (ders.ogretmen_id) {
              const [ogretmenMevcut] = await connection.promise().query(
                `SELECT i.* FROM islenme i
                JOIN ders_verme dv ON i.ders_kodu = dv.ders_kodu
                WHERE dv.ogretmen_id = ? AND i.gun = ? AND i.saat = ?`,
                [ders.ogretmen_id, gun, saat]
              );
              
              if (ogretmenMevcut.length > 0) continue;
            }
            
            // 3. Öğrenci çakışması kontrolü
            const [ogrenciCakisma] = await connection.promise().query(
              `SELECT DISTINCT dk.ogrenci_no
              FROM ders_kaydi dk
              JOIN islenme i ON dk.ders_kodu = i.ders_kodu
              WHERE dk.ogrenci_no IN (
                SELECT ogrenci_no FROM ogrenci WHERE bolum_id = ?
              )
              AND i.gun = ? AND i.saat = ?`,
              [bolum_id, gun, saat]
            );
            
            if (ogrenciCakisma.length > 0) continue;
            
            // Tüm kontroller başarılı, dersi programla
            await connection.promise().query(
              'INSERT INTO islenme (ders_kodu, derslik_id, gun, saat) VALUES (?, ?, ?, ?)',
              [ders.ders_kodu, derslik.derslik_id, gun, saat]
            );
            
            // Günlük ders sayısını güncelle
            gunlukDersSayisi[gun]++;
            dersProgramlandi = true;
            break;
          }
        }
      }
    }
    
    res.json({ 
      message: `${currentDonem} dönemi için ders programı başarıyla oluşturuldu.`,
      donem: currentDonem
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Program oluşturulurken bir hata oluştu.' });
  }
});

// Bölüme göre ders programı görüntüleme endpoint'i
app.get('/api/ders-programi/bolum/:bolum_id', async (req, res) => {
  const { bolum_id } = req.params;
  
  try {
    const query = `
      SELECT 
        i.*,
        d.ad as ders_adi,
        d.ders_kodu,
        dl.bina,
        dl.kat,
        dl.kapasite,
        ou.ad as ogretmen_adi,
        ou.soyad as ogretmen_soyad
      FROM islenme i
      JOIN ders d ON i.ders_kodu = d.ders_kodu
      JOIN derslik dl ON i.derslik_id = dl.derslik_id
      LEFT JOIN ders_verme dv ON i.ders_kodu = dv.ders_kodu
      LEFT JOIN ogretim_uyesi ou ON dv.ogretmen_id = ou.ogretmen_id
      WHERE d.bolum_id = ?
      ORDER BY 
        FIELD(i.gun, 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'),
        i.saat
    `;
    
    const [results] = await connection.promise().query(query, [bolum_id]);
    res.json(results);
    
  } catch (error) {
    res.status(500).json({ message: 'Program görüntülenirken bir hata oluştu.' });
  }
});

// Kullanıcı adı değiştirme
app.put('/api/kullanici/kullanici-adi-degistir', async (req, res) => {
  const { yeni_kullanici_adi, mevcut_sifre, user } = req.body;

  if (!user || !user.kullanici_id) {
    return res.status(400).json({ message: 'Kullanıcı bilgileri eksik!' });
  }

  try {
    // Önce mevcut şifreyi kontrol et
    const [currentUser] = await connection.promise().query(
      'SELECT * FROM kullanici WHERE kullanici_id = ? AND sifre = ?',
      [user.kullanici_id, mevcut_sifre]
    );

    if (currentUser.length === 0) {
      return res.status(400).json({ message: 'Mevcut şifre yanlış!' });
    }

    // Kullanıcı adının benzersiz olup olmadığını kontrol et
    const [existingUser] = await connection.promise().query(
      'SELECT * FROM kullanici WHERE kullanici_adi = ? AND kullanici_id != ?',
      [yeni_kullanici_adi, user.kullanici_id]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanılıyor!' });
    }

    // Kullanıcı adını güncelle
    const [updateResult] = await connection.promise().query(
      'UPDATE kullanici SET kullanici_adi = ? WHERE kullanici_id = ?',
      [yeni_kullanici_adi, user.kullanici_id]
    );

    res.json({ 
      message: 'Kullanıcı adı başarıyla güncellendi.',
      yeni_kullanici_adi
    });
  } catch (error) {
    res.status(500).json({ message: 'Kullanıcı adı güncellenirken bir hata oluştu.' });
  }
});

// Şifre değiştirme
app.put('/api/kullanici/sifre-degistir', async (req, res) => {
  const { mevcut_sifre, yeni_sifre, user } = req.body;

  if (!user || !user.kullanici_id) {
    return res.status(400).json({ message: 'Kullanıcı bilgileri eksik!' });
  }

  try {
    // Önce mevcut şifreyi kontrol et
    const [currentUser] = await connection.promise().query(
      'SELECT * FROM kullanici WHERE kullanici_id = ? AND sifre = ?',
      [user.kullanici_id, mevcut_sifre]
    );

    if (currentUser.length === 0) {
      return res.status(400).json({ message: 'Mevcut şifre yanlış!' });
    }

    // Şifreyi güncelle
    const [updateResult] = await connection.promise().query(
      'UPDATE kullanici SET sifre = ? WHERE kullanici_id = ?',
      [yeni_sifre, user.kullanici_id]
    );

    res.json({ message: 'Şifre başarıyla güncellendi.' });
  } catch (error) {
    res.status(500).json({ message: 'Şifre güncellenirken bir hata oluştu.' });
  }
});

// Öğrenci dashboard istatistikleri
app.get('/api/student/dashboard', (req, res) => {
  const kullanici_adi = req.headers['x-user'];

  if (!kullanici_adi) {
    return res.status(401).json({ message: 'Kullanıcı bilgisi bulunamadı.' });
  }

  // Önce kullanıcıyı kontrol et
  const kullaniciQuery = 'SELECT * FROM kullanici WHERE kullanici_adi = ?';
  connection.query(kullaniciQuery, [kullanici_adi], (err, kullaniciResults) => {
    if (err) {
      return res.status(500).json({ message: 'Veritabanı hatası.' });
    }

    if (kullaniciResults.length === 0) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    // Öğrenci numarasını kullanıcı adından çıkar
    const ogrenci_no = kullanici_adi.split('@')[0];

    // Öğrenciyi kontrol et
    const ogrenciQuery = 'SELECT * FROM ogrenci WHERE ogrenci_no = ?';
    connection.query(ogrenciQuery, [ogrenci_no], (err, ogrenciResults) => {
      if (err) {
        return res.status(500).json({ message: 'Veritabanı hatası.' });
      }

      if (ogrenciResults.length === 0) {
        return res.status(404).json({ message: 'Öğrenci bulunamadı.' });
      }

      // İstatistikleri topla
      const queries = {
        toplamDers: `
          SELECT COUNT(DISTINCT ders_kodu) as count 
          FROM ders_kaydi 
          WHERE ogrenci_no = ?
        `,
        basariliDersler: `
          SELECT COUNT(DISTINCT ders_kodu) as count 
          FROM ders_kaydi 
          WHERE ogrenci_no = ? AND notu >= 60
        `,
        toplamKredi: `
          SELECT COALESCE(SUM(d.kredi), 0) as total
          FROM ders_kaydi dk
          JOIN ders d ON dk.ders_kodu = d.ders_kodu
          WHERE dk.ogrenci_no = ? AND dk.notu >= 60
        `
      };

      const stats = {};
      let completedQueries = 0;

      Object.entries(queries).forEach(([key, query]) => {
        connection.query(query, [ogrenci_no], (err, result) => {
          if (err) {
            return res.status(500).json({ message: 'Veritabanı hatası.' });
          }
          stats[key] = key === 'toplamKredi' ? result[0].total : result[0].count;
          completedQueries++;

          if (completedQueries === Object.keys(queries).length) {
            res.json(stats);
          }
        });
      });
    });
  });
});

// Öğrencinin derslerini getir
app.get('/api/student/courses', (req, res) => {
  const kullanici_adi = req.headers['x-user'];

  if (!kullanici_adi) {
    return res.status(401).json({ message: 'Kullanıcı bilgisi bulunamadı.' });
  }

  // Öğrenci numarasını kullanıcı adından çıkar
  const ogrenci_no = kullanici_adi.split('@')[0];

  const query = `
    SELECT 
      dk.*,
      d.ad as ders_adi,
      d.kredi,
      d.donem,
      d.zorunlu_mu,
      b.ad as bolum_adi,
      ou.ad as ogretmen_adi,
      ou.soyad as ogretmen_soyad,
      ou.unvan as ogretmen_unvan
    FROM ders_kaydi dk
    JOIN ders d ON dk.ders_kodu = d.ders_kodu
    JOIN bolum b ON d.bolum_id = b.bolum_id
    LEFT JOIN ders_verme dv ON d.ders_kodu = dv.ders_kodu
    LEFT JOIN ogretim_uyesi ou ON dv.ogretmen_id = ou.ogretmen_id
    WHERE dk.ogrenci_no = ?
    ORDER BY dk.yil DESC, 
      CASE dk.donem 
        WHEN 'GUZ' THEN 1 
        WHEN 'BAHAR' THEN 2 
        WHEN 'YAZ' THEN 3 
      END DESC,
      d.ders_kodu
  `;

  connection.query(query, [ogrenci_no], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Veritabanı hatası.' });
    }
    res.json(results);
  });
});

// Öğrenci ders programı endpoint'i
app.get('/api/student/schedule', async (req, res) => {
  const username = req.headers['x-user']; 

  if (!username) {
    return res.status(400).json({ error: 'Kullanıcı adı gerekli' });
  }

  try {
    // Kullanıcının varlığını kontrol et
    const [users] = await connection.promise().query('SELECT * FROM kullanici WHERE kullanici_adi = ?', [username]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    // Öğrenci numarasını bul
    const ogrenciNo = username.split('@')[0];

    // Mevcut dönemdeki ve notu olmayan dersleri getir
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    let currentSemester = 'GUZ';
    if (currentDate.getMonth() >= 2 && currentDate.getMonth() <= 5) {
      currentSemester = 'BAHAR';
    } else if (currentDate.getMonth() >= 6 && currentDate.getMonth() <= 8) {
      currentSemester = 'YAZ';
    }

    const query = `
      SELECT 
        d.ders_kodu,
        d.ad as ders_adi,
        i.gun,
        i.saat,
        dl.bina,
        dl.kat,
        ou.unvan as ogretmen_unvan,
        ou.ad as ogretmen_adi,
        ou.soyad as ogretmen_soyad
      FROM ders_kaydi dk
      JOIN ders d ON dk.ders_kodu = d.ders_kodu
      JOIN islenme i ON dk.ders_kodu = i.ders_kodu
      JOIN derslik dl ON i.derslik_id = dl.derslik_id
      LEFT JOIN ders_verme dv ON d.ders_kodu = dv.ders_kodu
      LEFT JOIN ogretim_uyesi ou ON dv.ogretmen_id = ou.ogretmen_id
      WHERE dk.ogrenci_no = ?
      AND dk.yil = ?
      AND dk.donem = ?
      AND dk.notu IS NULL
      AND d.donem = ?
      ORDER BY FIELD(i.gun, 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'), i.saat
    `;

    const [schedule] = await connection.promise().query(query, [ogrenciNo, currentYear, currentSemester, currentSemester]);

    res.json(schedule);
  } catch (error) { 
    res.status(500).json({ error: 'Ders programı alınırken bir hata oluştu' });
  }
});

// Mevcut dönemdeki dersleri getir
app.get('/api/student/current-semester-courses', async (req, res) => {
  const username = req.headers['x-user'];
  if (!username) {
    return res.status(401).json({ message: 'Kullanıcı bilgisi bulunamadı' });
  }

  try {
    // Mevcut dönemi belirle
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    let currentSemester;
    
    if (currentMonth >= 9 && currentMonth <= 12) {
      currentSemester = 'GUZ';
    } else if (currentMonth >= 2 && currentMonth <= 6) {
      currentSemester = 'BAHAR';
    } else {
      currentSemester = 'YAZ';
    }

    const currentYear = currentDate.getFullYear();

    // Öğrenci numarasını bul
    const ogrenciNo = username.split('@')[0];

    // Öğrencinin bölümünü bul
    const [student] = await connection.promise().query(
      'SELECT bolum_id FROM ogrenci WHERE ogrenci_no = ?',
      [ogrenciNo]
    );

    if (!student.length) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı' });
    }

    // Öğrencinin bölümündeki ve mevcut dönemdeki dersleri getir
    const [courses] = await connection.promise().query(
      `SELECT d.*, 
        CONCAT(ou.unvan, ' ', ou.ad, ' ', ou.soyad) as ogretmen_adi,
        i.derslik_id, i.gun, i.saat,
        dl.bina, dl.kat
      FROM ders d
      LEFT JOIN ders_verme dv ON d.ders_kodu = dv.ders_kodu
      LEFT JOIN ogretim_uyesi ou ON dv.ogretmen_id = ou.ogretmen_id
      LEFT JOIN islenme i ON d.ders_kodu = i.ders_kodu
      LEFT JOIN derslik dl ON i.derslik_id = dl.derslik_id
      WHERE d.bolum_id = ? AND d.donem = ?`,
      [student[0].bolum_id, currentSemester]
    );

    // Öğrencinin kayıtlı olduğu dersleri getir
    const [registeredCourses] = await connection.promise().query(
      'SELECT ders_kodu FROM ders_kaydi WHERE ogrenci_no = ? AND yil = ? AND donem = ?',
      [ogrenciNo, currentYear, currentSemester]
    );

    const registeredCourseCodes = registeredCourses.map(c => c.ders_kodu);

    // Dersleri işle ve kayıt durumunu ekle
    const processedCourses = courses.map(course => ({
      ...course,
      kayitli: registeredCourseCodes.includes(course.ders_kodu)
    }));

    res.json(processedCourses);
  } catch (error) { 
    res.status(500).json({ message: 'Dersler getirilirken bir hata oluştu' });
  }
});

// Ders kaydı
app.post('/api/student/register-course', async (req, res) => {
  const username = req.headers['x-user'];
  const { ders_kodu } = req.body;

  if (!username || !ders_kodu) {
    return res.status(400).json({ message: 'Eksik bilgi' });
  }

  try {
    // Mevcut dönemi belirle
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    let currentSemester;
    
    if (currentMonth >= 9 && currentMonth <= 12) {
      currentSemester = 'GUZ';
    } else if (currentMonth >= 2 && currentMonth <= 6) {
      currentSemester = 'BAHAR';
    } else {
      currentSemester = 'YAZ';
    }

    const currentYear = currentDate.getFullYear();

    // Öğrenci numarasını bul
    const ogrenciNo = username.split('@')[0];

    // Öğrencinin varlığını kontrol et
    const [student] = await connection.promise().query(
      'SELECT * FROM ogrenci WHERE ogrenci_no = ?',
      [ogrenciNo]
    );

    if (!student.length) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı' });
    }

    // Dersin mevcut dönemde açılıp açılmadığını kontrol et
    const [course] = await connection.promise().query(
      'SELECT * FROM ders WHERE ders_kodu = ? AND donem = ?',
      [ders_kodu, currentSemester]
    );

    if (!course.length) {
      return res.status(400).json({ message: 'Bu ders bu dönemde açılmamış' });
    }

    // Öğrencinin daha önce bu dersi alıp almadığını kontrol et
    const [existingRegistration] = await connection.promise().query(
      'SELECT * FROM ders_kaydi WHERE ogrenci_no = ? AND ders_kodu = ? AND yil = ? AND donem = ?',
      [ogrenciNo, ders_kodu, currentYear, currentSemester]
    );

    if (existingRegistration.length > 0) {
      return res.status(400).json({ message: 'Bu derse zaten kayıtlısınız' });
    }

    // Dersin ön koşullarını kontrol et
    const [prerequisites] = await connection.promise().query(
      'SELECT on_kosul_kodu FROM on_kosul WHERE ders_kodu = ?',
      [ders_kodu]
    );

    if (prerequisites.length > 0) {
      // Öğrencinin ön koşul derslerini ve notlarını kontrol et
      const [prerequisiteGrades] = await connection.promise().query(
        `SELECT dk.ders_kodu, dk.notu 
         FROM ders_kaydi dk 
         WHERE dk.ogrenci_no = ? AND dk.ders_kodu IN (?)`,
        [ogrenciNo, prerequisites.map(p => p.on_kosul_kodu)]
      );

      // Eksik ön koşulları bul
      const missingPrerequisites = prerequisites.filter(p => 
        !prerequisiteGrades.some(g => g.ders_kodu === p.on_kosul_kodu && g.notu >= 2.00)
      );

      if (missingPrerequisites.length > 0) {
        // Eksik ön koşul derslerinin adlarını al
        const [missingCourses] = await connection.promise().query(
          'SELECT ders_kodu, ad FROM ders WHERE ders_kodu IN (?)',
          [missingPrerequisites.map(p => p.on_kosul_kodu)]
        );

        return res.status(400).json({ 
          message: 'Bu dersi almak için ön koşul derslerini başarıyla tamamlamanız gerekiyor.',
          missingPrerequisites: missingCourses
        });
      }
    }

    // Ders kaydını yap
    await connection.promise().query(
      'INSERT INTO ders_kaydi (ogrenci_no, ders_kodu, yil, donem) VALUES (?, ?, ?, ?)',
      [ogrenciNo, ders_kodu, currentYear, currentSemester]
    );

    res.json({ message: 'Ders kaydı başarıyla yapıldı' });
  } catch (error) {
    res.status(500).json({ message: 'Ders kaydı yapılırken bir hata oluştu' });
  }
});

// Ders bırakma
app.delete('/api/student/drop-course/:ders_kodu', async (req, res) => {
  const username = req.headers['x-user'];
  const { ders_kodu } = req.params;

  if (!username || !ders_kodu) {
    return res.status(400).json({ error: 'Kullanıcı adı ve ders kodu gerekli' });
  }

  try {
    // Öğrenci numarasını bul
    const ogrenciNo = username.split('@')[0];

    // Mevcut dönem bilgilerini al
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    let currentSemester = 'GUZ';
    if (currentDate.getMonth() >= 2 && currentDate.getMonth() <= 5) {
      currentSemester = 'BAHAR';
    } else if (currentDate.getMonth() >= 6 && currentDate.getMonth() <= 8) {
      currentSemester = 'YAZ';
    }

    // Ders kaydını sil
    const [result] = await connection.promise().query(
      'DELETE FROM ders_kaydi WHERE ogrenci_no = ? AND ders_kodu = ? AND yil = ? AND donem = ?',
      [ogrenciNo, ders_kodu, currentYear, currentSemester]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Ders kaydı bulunamadı' });
    }

    res.json({ message: 'Ders başarıyla bırakıldı' });
  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Öğrenci bilgilerini getir
app.get('/api/ogrenci/bilgiler/:kullanici_adi', async (req, res) => {
  const { kullanici_adi } = req.params;
  const ogrenci_no = kullanici_adi.split('@')[0]; // @ogr kısmını kaldır

  const query = `
    SELECT 
      o.*,
      b.ad as bolum_adi,
      v.veli_id,
      v.ad as veli_ad,
      v.soyad as veli_soyad,
      v.telefon as veli_telefon,
      v.e_posta as veli_e_posta,
      ou.ad as danisman_ad,
      ou.soyad as danisman_soyad,
      ou.unvan as danisman_unvan
    FROM ogrenci o 
    LEFT JOIN bolum b ON o.bolum_id = b.bolum_id
    LEFT JOIN veli_ogrenci vo ON o.ogrenci_no = vo.ogrenci_no
    LEFT JOIN veli v ON vo.veli_id = v.veli_id
    LEFT JOIN danismanlik d ON o.ogrenci_no = d.ogrenci_no
    LEFT JOIN ogretim_uyesi ou ON d.ogretmen_id = ou.ogretmen_id
    WHERE o.ogrenci_no = ?
  `;
  
  connection.query(query, [ogrenci_no], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Öğrenci bilgileri alınırken hata oluştu.' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı.' });
    }
    res.json(results[0]);
  });
});

// Öğrenci not ortalamasını hesapla
app.get('/api/ogrenci/not-ortalamasi/:kullanici_adi', async (req, res) => {
  const { kullanici_adi } = req.params;
  const ogrenci_no = kullanici_adi.split('@')[0]; // @ogr kısmını kaldır

  const query = `
    SELECT 
      d.ders_kodu,
      d.ad as ders_adi,
      d.kredi,
      dk.notu,
      dk.yil,
      dk.donem
    FROM ders_kaydi dk
    JOIN ders d ON dk.ders_kodu = d.ders_kodu
    WHERE dk.ogrenci_no = ?
    ORDER BY dk.yil DESC, 
      CASE dk.donem 
        WHEN 'GUZ' THEN 1 
        WHEN 'BAHAR' THEN 2 
        WHEN 'YAZ' THEN 3 
      END DESC
  `;

  connection.query(query, [ogrenci_no], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Not ortalaması hesaplanırken hata oluştu.' });
    }

    let toplamKredi = 0;
    let toplamNot = 0;
    let dersler = results;

    results.forEach(ders => {
      if (ders.notu !== null) {
        toplamKredi += ders.kredi;
        toplamNot += ders.notu * ders.kredi;
      }
    });

    const gano = toplamKredi > 0 ? (toplamNot / toplamKredi).toFixed(2) : 0;

    res.json({
      gano,
      toplamKredi,
      dersler
    });
  });
});

// Veli ekle
app.post('/api/ogrenci/veli-ekle', async (req, res) => {
  const { ogrenci_no, ad, soyad, telefon, e_posta } = req.body;
  
  connection.beginTransaction(err => {
    if (err) {
      return res.status(500).json({ message: 'İşlem başlatılırken hata oluştu.' });
    }
    
    // Önce veliyi ekle
    const veliQuery = 'INSERT INTO veli (ad, soyad, telefon, e_posta) VALUES (?, ?, ?, ?)';
    connection.query(veliQuery, [ad, soyad, telefon, e_posta], (err, result) => {
      if (err) {
        return connection.rollback(() => {
          res.status(500).json({ message: 'Veli eklenirken hata oluştu.' });
        });
      }
      
      const veli_id = result.insertId;
      
      // Veli-öğrenci ilişkisini ekle
      const veliOgrenciQuery = 'INSERT INTO veli_ogrenci (ogrenci_no, veli_id) VALUES (?, ?)';
      connection.query(veliOgrenciQuery, [ogrenci_no, veli_id], (err, result) => {
        if (err) {
          return connection.rollback(() => {
            res.status(500).json({ message: 'Veli-öğrenci ilişkisi eklenirken hata oluştu.' });
          });
        }
        
        connection.commit(err => {
          if (err) {
            return connection.rollback(() => {
              res.status(500).json({ message: 'İşlem tamamlanırken hata oluştu.' });
            });
          }
          res.json({ message: 'Veli başarıyla eklendi.' });
        });
      });
    });
  });
});

// Veli sil
app.delete('/api/ogrenci/veli-sil/:ogrenci_no/:veli_id', async (req, res) => {
  const { ogrenci_no, veli_id } = req.params;
  
  connection.beginTransaction(err => {
    if (err) {
      return res.status(500).json({ message: 'İşlem başlatılırken hata oluştu.' });
    }
    
    // Önce veli-öğrenci ilişkisini sil
    const veliOgrenciQuery = 'DELETE FROM veli_ogrenci WHERE ogrenci_no = ? AND veli_id = ?';
    connection.query(veliOgrenciQuery, [ogrenci_no, veli_id], (err, result) => {
      if (err) {
        return connection.rollback(() => {
          res.status(500).json({ message: 'Veli-öğrenci ilişkisi silinirken hata oluştu.' });
        });
      }
      
      // Sonra veliyi sil
      const veliQuery = 'DELETE FROM veli WHERE veli_id = ?';
      connection.query(veliQuery, [veli_id], (err, result) => {
        if (err) {
          return connection.rollback(() => {
            res.status(500).json({ message: 'Veli silinirken hata oluştu.' });
          });
        }
        
        connection.commit(err => {
          if (err) {
            return connection.rollback(() => {
              res.status(500).json({ message: 'İşlem tamamlanırken hata oluştu.' });
            });
          }
          res.json({ message: 'Veli başarıyla silindi.' });
        });
      });
    });
  });
});

// Akademik personel dashboard API'si
app.get('/api/academic/dashboard', async (req, res) => {
  try {
    const username = req.headers['x-user'];
    if (!username) {
      return res.status(400).json({ error: 'Kullanıcı adı gerekli' });
    }

    // Öğretim üyesi ID'sini kullanıcı adından çıkar
    const ogretmenId = username.split('@')[0];

    // Öğretim üyesi bilgilerini al
    const [ogretimUyesi] = await connection.promise().query(
      `SELECT o.*, b.ad as bolum_adi 
       FROM ogretim_uyesi o 
       JOIN bolum b ON o.bolum_id = b.bolum_id 
       WHERE o.ogretmen_id = ?`,
      [ogretmenId]
    );

    if (!ogretimUyesi || ogretimUyesi.length === 0) {
      return res.status(404).json({ error: 'Öğretim üyesi bulunamadı' });
    }

    // Verilen ders sayısını al
    const [verilenDersler] = await connection.promise().query(
      `SELECT COUNT(*) as ders_sayisi 
       FROM ders_verme 
       WHERE ogretmen_id = ?`,
      [ogretmenId]
    );

    // Danışman olduğu öğrenci sayısını al
    const [danismanOgrenciler] = await connection.promise().query(
      `SELECT COUNT(*) as ogrenci_sayisi 
       FROM danismanlik 
       WHERE ogretmen_id = ?`,
      [ogretmenId]
    );

    // Aktif dönemi belirle
    const currentDate = new Date();
    const month = currentDate.getMonth();
    let aktifDonem = 'BAHAR';
    if (month >= 8 && month <= 12) {
      aktifDonem = 'GUZ';
    } else if (month >= 1 && month <= 5) {
      aktifDonem = 'BAHAR';
    } else {
      aktifDonem = 'YAZ';
    }

    res.json({
      verilenDersSayisi: verilenDersler[0].ders_sayisi || 0,
      danismanOgrenciSayisi: danismanOgrenciler[0].ogrenci_sayisi || 0,
      aktifDonem: aktifDonem,
      bolumAdi: ogretimUyesi[0].bolum_adi,
      unvan: ogretimUyesi[0].unvan
    });

  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Akademik personel dersleri endpoint'i
app.get('/api/academic/derslerim', async (req, res) => {
  const username = req.headers['x-user'];
  const ogretmenId = username.split('@')[0];

  try {
    const [dersler] = await connection.promise().query(`
      SELECT 
        d.ders_kodu,
        d.ad as ders_adi,
        d.kredi,
        d.donem,
        COUNT(DISTINCT dk.ogrenci_no) as ogrenci_sayisi,
        AVG(dk.notu) as ortalama_not
      FROM ders_verme dv
      JOIN ders d ON dv.ders_kodu = d.ders_kodu
      LEFT JOIN ders_kaydi dk ON d.ders_kodu = dk.ders_kodu
      WHERE dv.ogretmen_id = ?
      GROUP BY d.ders_kodu, d.ad, d.kredi, d.donem
      ORDER BY d.donem DESC, d.ders_kodu
    `, [ogretmenId]);

    res.json(dersler);
  } catch (error) {
    res.status(500).json({ error: 'Dersler getirilirken bir hata oluştu' });
  }
});

// Akademik personel: Bir dersin öğrenci listesini ve notlarını getir (aktif dönem)
app.get('/api/academic/ders-ogrencileri/:ders_kodu', async (req, res) => {
  const { ders_kodu } = req.params;
  const username = req.headers['x-user'];
  const ogretmenId = username.split('@')[0];

  // Aktif dönemi ve yılı bul
  const now = new Date();
  const year = now.getFullYear();
  let donem = 'GUZ';
  const month = now.getMonth() + 1;
  if (month >= 2 && month <= 6) donem = 'BAHAR';
  else if (month >= 7 && month <= 8) donem = 'YAZ';

  try {
    // Bu dersi gerçekten bu öğretim üyesi veriyor mu kontrolü
    const [kontrol] = await connection.promise().query(
      'SELECT * FROM ders_verme WHERE ders_kodu = ? AND ogretmen_id = ?',
      [ders_kodu, ogretmenId]
    );
    if (!kontrol.length) {
      return res.status(403).json({ message: 'Bu dersi vermeye yetkiniz yok.' });
    }

    // Dersi alan öğrencileri ve notlarını getir
    const [ogrenciler] = await connection.promise().query(
      `SELECT dk.ogrenci_no, o.ad, o.soyad, dk.notu
       FROM ders_kaydi dk
       JOIN ogrenci o ON dk.ogrenci_no = o.ogrenci_no
       WHERE dk.ders_kodu = ? AND dk.yil = ? AND dk.donem = ?
       ORDER BY o.ad, o.soyad`,
      [ders_kodu, year, donem]
    );
    res.json(ogrenciler);
  } catch (error) {
    res.status(500).json({ message: 'Öğrenci listesi alınırken hata oluştu.' });
  }
});

// Akademik personel: Bir öğrencinin notunu güncelle
app.put('/api/academic/not-guncelle', async (req, res) => {
  const { ders_kodu, ogrenci_no, notu } = req.body;
  const username = req.headers['x-user'];
  const ogretmenId = username.split('@')[0];

  // Aktif dönemi ve yılı bul
  const now = new Date();
  const year = now.getFullYear();
  let donem = 'GUZ';
  const month = now.getMonth() + 1;
  if (month >= 2 && month <= 6) donem = 'BAHAR';
  else if (month >= 7 && month <= 8) donem = 'YAZ';

  try {
    // Bu dersi gerçekten bu öğretim üyesi veriyor mu kontrolü
    const [kontrol] = await connection.promise().query(
      'SELECT * FROM ders_verme WHERE ders_kodu = ? AND ogretmen_id = ?',
      [ders_kodu, ogretmenId]
    );
    if (!kontrol.length) {
      return res.status(403).json({ message: 'Bu dersi vermeye yetkiniz yok.' });
    }

    // Notu güncelle
    const [result] = await connection.promise().query(
      'UPDATE ders_kaydi SET notu = ? WHERE ders_kodu = ? AND ogrenci_no = ? AND yil = ? AND donem = ?',
      [notu, ders_kodu, ogrenci_no, year, donem]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Kayıt bulunamadı.' });
    }
    res.json({ message: 'Not başarıyla güncellendi.' });
  } catch (error) {
    res.status(500).json({ message: 'Not güncellenirken hata oluştu.' });
  }
});

// Akademik personel ders programı endpoint'i
app.get('/api/academic/ders-programi', async (req, res) => {
  const username = req.headers['x-user'];
  const ogretmenId = username.split('@')[0];

  // Aktif dönemi ve yılı belirle
  const now = new Date();
  const year = now.getFullYear();
  let donem = 'GUZ';
  const month = now.getMonth() + 1;
  if (month >= 2 && month <= 6) donem = 'BAHAR';
  else if (month >= 7 && month <= 8) donem = 'YAZ';

  try {
    const query = `
      SELECT 
        i.*,
        d.ders_kodu,
        d.ad as ders_adi,
        d.kredi,
        dl.bina,
        dl.kat,
        dl.kapasite,
        COUNT(DISTINCT dk.ogrenci_no) as ogrenci_sayisi
      FROM islenme i
      JOIN ders d ON i.ders_kodu = d.ders_kodu
      JOIN derslik dl ON i.derslik_id = dl.derslik_id
      JOIN ders_verme dv ON d.ders_kodu = dv.ders_kodu
      LEFT JOIN ders_kaydi dk ON d.ders_kodu = dk.ders_kodu 
        AND dk.yil = ? AND dk.donem = ?
      WHERE dv.ogretmen_id = ?
        AND d.donem = ?
      GROUP BY i.ders_kodu, i.derslik_id, i.gun, i.saat
      ORDER BY 
        FIELD(i.gun, 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'),
        i.saat
    `;

    const [program] = await connection.promise().query(query, [year, donem, ogretmenId, donem]);
    res.json(program);
  } catch (error) {
    res.status(500).json({ message: 'Ders programı alınırken bir hata oluştu' });
  }
});

// Akademik personel: Danışmanı olduğu öğrencileri getir
app.get('/api/academic/danismanlik-ogrencileri', async (req, res) => {
  const username = req.headers['x-user'];
  const ogretmenId = username.split('@')[0];

  try {
    const query = `
      SELECT 
        o.ogrenci_no,
        o.ad,
        o.soyad,
        o.e_posta,
        o.telefon,
        o.sinif,
        o.statu,
        b.ad as bolum_adi,
        (
          SELECT AVG(dk.notu)
          FROM ders_kaydi dk
          WHERE dk.ogrenci_no = o.ogrenci_no
          AND dk.notu IS NOT NULL
        ) as gano
      FROM danismanlik d
      JOIN ogrenci o ON d.ogrenci_no = o.ogrenci_no
      JOIN bolum b ON o.bolum_id = b.bolum_id
      WHERE d.ogretmen_id = ?
      ORDER BY o.ad, o.soyad
    `;

    const [ogrenciler] = await connection.promise().query(query, [ogretmenId]);
    res.json(ogrenciler);
  } catch (error) {
    res.status(500).json({ message: 'Danışmanlık öğrencileri alınırken bir hata oluştu' });
  }
});

// Akademik personel bilgilerini getir
app.get('/api/ogretim-uyesi/bilgiler/:kullanici_adi', async (req, res) => {
  const { kullanici_adi } = req.params;
  const ogretmenId = kullanici_adi.split('@')[0];

  try {
    const [ogretimUyesi] = await connection.promise().query(
      `SELECT ou.*, b.ad as bolum_adi
       FROM ogretim_uyesi ou
       JOIN bolum b ON ou.bolum_id = b.bolum_id
       WHERE ou.ogretmen_id = ?`,
      [ogretmenId]
    );

    if (!ogretimUyesi || ogretimUyesi.length === 0) {
      return res.status(404).json({ message: 'Öğretim üyesi bulunamadı.' });
    }

    res.json(ogretimUyesi[0]);
  } catch (error) {
    res.status(500).json({ message: 'Öğretim üyesi bilgileri alınırken bir hata oluştu.' });
  }
});

// Ders ön koşullarını getir
app.get('/api/ders/on-kosullar/:ders_kodu', async (req, res) => {
  const { ders_kodu } = req.params;

  try {
    const query = `
      SELECT o.on_kosul_kodu, d.ders_kodu, d.ad
      FROM on_kosul o
      JOIN ders d ON o.on_kosul_kodu = d.ders_kodu
      WHERE o.ders_kodu = ?
    `;

    const [prerequisites] = await connection.promise().query(query, [ders_kodu]);
    res.json(prerequisites);
  } catch (error) {
    console.error('Ön koşullar getirilirken hata:', error);
    res.status(500).json({ message: 'Ön koşullar getirilirken bir hata oluştu' });
  }
});

// Ders ön koşulu ekle
app.post('/api/ders/on-kosul-ekle', async (req, res) => {
  const { ders_kodu, on_kosul_kodu } = req.body;

  if (!ders_kodu || !on_kosul_kodu) {
    return res.status(400).json({ message: 'Ders kodu ve ön koşul ders kodu gerekli.' });
  }

  try {
    // Döngüsel bağımlılık kontrolü
    const [existingPrerequisites] = await connection.promise().query(
      'SELECT * FROM on_kosul WHERE ders_kodu = ? AND on_kosul_kodu = ?',
      [on_kosul_kodu, ders_kodu]
    );

    if (existingPrerequisites.length > 0) {
      return res.status(400).json({ message: 'Döngüsel bağımlılık oluşturulamaz.' });
    }

    // Ön koşulu ekle
    await connection.promise().query(
      'INSERT INTO on_kosul (ders_kodu, on_kosul_kodu) VALUES (?, ?)',
      [ders_kodu, on_kosul_kodu]
    );

    res.json({ message: 'Ön koşul başarıyla eklendi.' });
  } catch (error) {
    console.error('Ön koşul eklenirken hata:', error);
    res.status(500).json({ message: 'Ön koşul eklenirken bir hata oluştu.' });
  }
});

// Ders ön koşulu sil
app.delete('/api/ders/on-kosul-sil', async (req, res) => {
  const { ders_kodu, on_kosul_kodu } = req.body;

  if (!ders_kodu || !on_kosul_kodu) {
    return res.status(400).json({ message: 'Ders kodu ve ön koşul ders kodu gerekli.' });
  }

  try {
    await connection.promise().query(
      'DELETE FROM on_kosul WHERE ders_kodu = ? AND on_kosul_kodu = ?',
      [ders_kodu, on_kosul_kodu]
    );

    res.json({ message: 'Ön koşul başarıyla silindi.' });
  } catch (error) {
    console.error('Ön koşul silinirken hata:', error);
    res.status(500).json({ message: 'Ön koşul silinirken bir hata oluştu.' });
  }
});

// Öğrencinin bir dersi geçip geçmediğini kontrol et
app.get('/api/student/course-status/:ders_kodu', async (req, res) => {
  const { ders_kodu } = req.params;
  const username = req.headers['x-user'];

  if (!username) {
    return res.status(401).json({ message: 'Kullanıcı bilgisi bulunamadı.' });
  }

  try {
    const ogrenciNo = username.split('@')[0];

    const [result] = await connection.promise().query(
      `SELECT notu 
       FROM ders_kaydi 
       WHERE ogrenci_no = ? AND ders_kodu = ? AND notu >= 2.00`,
      [ogrenciNo, ders_kodu]
    );

    res.json({ passed: result.length > 0 });
  } catch (error) {
    console.error('Ders durumu kontrol edilirken hata:', error);
    res.status(500).json({ message: 'Ders durumu kontrol edilirken bir hata oluştu.' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda çalışıyor.`);
}); 