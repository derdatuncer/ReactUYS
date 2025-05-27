import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, message, Modal, InputNumber, Button } from 'antd';
import axios from 'axios';

const getActiveSemester = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  if (month >= 2 && month <= 6) return 'BAHAR';
  if (month >= 7 && month <= 8) return 'YAZ';
  return 'GUZ';
};

const AkademiDerslerim = () => {
  const [dersler, setDersler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDers, setSelectedDers] = useState(null);
  const [ogrenciler, setOgrenciler] = useState([]);
  const [notlar, setNotlar] = useState({});
  const [notGuncelleLoading, setNotGuncelleLoading] = useState(false);

  const aktifDonem = getActiveSemester();

  useEffect(() => {
    const fetchDersler = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData?.kullanici_adi) {
          message.error('Kullanıcı bilgisi bulunamadı');
          return;
        }
        const response = await axios.get('http://localhost:5000/api/academic/derslerim');
        setDersler(response.data.filter(d => d.donem === aktifDonem));
      } catch (error) {
        message.error('Dersler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchDersler();
  }, [aktifDonem]);

  const openOgrenciListesi = async (ders) => {
    setSelectedDers(ders);
    setModalVisible(true);
    setOgrenciler([]);
    setNotlar({});
    try {
      const response = await axios.get(`http://localhost:5000/api/academic/ders-ogrencileri/${ders.ders_kodu}`);
      setOgrenciler(response.data);
      const notObj = {};
      response.data.forEach(o => {
        notObj[o.ogrenci_no] = o.notu;
      });
      setNotlar(notObj);
    } catch (error) {
      message.error('Öğrenci listesi alınırken hata oluştu');
    }
  };

  const handleNotDegistir = (ogrenci_no, value) => {
    setNotlar(prev => ({ ...prev, [ogrenci_no]: value }));
  };

  const handleNotKaydet = async (ogrenci_no) => {
    setNotGuncelleLoading(true);
    try {
      await axios.put('http://localhost:5000/api/academic/not-guncelle', {
        ders_kodu: selectedDers.ders_kodu,
        ogrenci_no,
        notu: notlar[ogrenci_no]
      });
      message.success('Not güncellendi');
    } catch (error) {
      message.error('Not güncellenirken hata oluştu');
    } finally {
      setNotGuncelleLoading(false);
    }
  };

  const columns = [
    {
      title: 'Ders Kodu',
      dataIndex: 'ders_kodu',
      key: 'ders_kodu',
      sorter: (a, b) => a.ders_kodu.localeCompare(b.ders_kodu),
    },
    {
      title: 'Ders Adı',
      dataIndex: 'ders_adi',
      key: 'ders_adi',
      sorter: (a, b) => a.ders_adi.localeCompare(b.ders_adi),
    },
    {
      title: 'Kredi',
      dataIndex: 'kredi',
      key: 'kredi',
      sorter: (a, b) => a.kredi - b.kredi,
    },
    {
      title: 'Dönem',
      dataIndex: 'donem',
      key: 'donem',
      render: (donem) => (
        <Tag color={donem === 'GUZ' ? 'blue' : donem === 'BAHAR' ? 'green' : 'orange'}>
          {donem}
        </Tag>
      ),
      sorter: (a, b) => a.donem.localeCompare(b.donem),
    },
    {
      title: 'Öğrenci Sayısı',
      dataIndex: 'ogrenci_sayisi',
      key: 'ogrenci_sayisi',
      sorter: (a, b) => a.ogrenci_sayisi - b.ogrenci_sayisi,
    },
    {
      title: 'Ortalama Not',
      dataIndex: 'ortalama_not',
      key: 'ortalama_not',
      render: (not) => not ? not.toFixed(2) : '-',
      sorter: (a, b) => (a.ortalama_not || 0) - (b.ortalama_not || 0),
    },
    {
      title: 'İşlemler',
      key: 'islemler',
      render: (_, record) => (
        <Button type="primary" onClick={() => openOgrenciListesi(record)}>
          Öğrenci Listesi / Not Girişi
        </Button>
      ),
    },
  ];

  return (
    <Card title={`Aktif Dönem: ${aktifDonem} | Derslerim`} loading={loading}>
      <Table
        columns={columns}
        dataSource={dersler}
        rowKey="ders_kodu"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Toplam ${total} ders`,
        }}
      />

      <Modal
        title={selectedDers ? `${selectedDers.ders_adi} - Öğrenci Listesi / Not Girişi` : ''}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Table
          dataSource={ogrenciler}
          rowKey="ogrenci_no"
          pagination={false}
          columns={[
            { title: 'Öğrenci No', dataIndex: 'ogrenci_no', key: 'ogrenci_no' },
            { title: 'Ad', dataIndex: 'ad', key: 'ad' },
            { title: 'Soyad', dataIndex: 'soyad', key: 'soyad' },
            {
              title: 'Not',
              dataIndex: 'notu',
              key: 'notu',
              render: (notu, record) => (
                <InputNumber
                  min={0}
                  max={100}
                  value={notlar[record.ogrenci_no]}
                  onChange={value => handleNotDegistir(record.ogrenci_no, value)}
                  style={{ width: 80 }}
                />
              )
            },
            {
              title: 'Kaydet',
              key: 'kaydet',
              render: (_, record) => (
                <Button
                  type="primary"
                  size="small"
                  loading={notGuncelleLoading}
                  onClick={() => handleNotKaydet(record.ogrenci_no)}
                >
                  Kaydet
                </Button>
              )
            }
          ]}
        />
      </Modal>
    </Card>
  );
};

export default AkademiDerslerim; 