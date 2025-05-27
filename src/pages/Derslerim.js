import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, message } from 'antd';
import axios from 'axios';

const Derslerim = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData?.kullanici_adi) {
          message.error('Kullanıcı bilgisi bulunamadı.');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/student/courses');
        setCourses(response.data);
      } catch (error) {
        message.error('Dersler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const donemRenkleri = {
    'GUZ': 'blue',
    'BAHAR': 'green',
    'YAZ': 'orange'
  };

  const donemEtiketleri = {
    'GUZ': 'Güz',
    'BAHAR': 'Bahar',
    'YAZ': 'Yaz'
  };

  // Not dönüşüm tablosu
  const notDönüşümTablosu = [
    { puan: '90-100', harf: 'A', katsayı: 4.00 },
    { puan: '85-89', harf: 'B1', katsayı: 3.50 },
    { puan: '80-84', harf: 'B2', katsayı: 3.25 },
    { puan: '75-79', harf: 'B3', katsayı: 3.00 },
    { puan: '70-74', harf: 'C1', katsayı: 2.75 },
    { puan: '65-69', harf: 'C2', katsayı: 2.50 },
    { puan: '60-64', harf: 'C3', katsayı: 2.00 },
    { puan: '50-59', harf: 'F1', katsayı: 1.50 },
    { puan: '0-49', harf: 'F2', katsayı: 0.00 }
  ];

  // Not rengini belirleme fonksiyonu
  const getNotRengi = (not) => {
    if (not === null) return 'default';
    if (not >= 3.50) return 'success';
    if (not >= 3.00) return 'processing';
    if (not >= 2.50) return 'warning';
    if (not >= 2.00) return 'default';
    return 'error';
  };

  const coursesColumns = [
    {
      title: 'Ders Kodu',
      dataIndex: 'ders_kodu',
      key: 'ders_kodu',
    },
    {
      title: 'Ders Adı',
      dataIndex: 'ders_adi',
      key: 'ders_adi',
    },
    {
      title: 'Dönem',
      dataIndex: 'donem',
      key: 'donem',
      render: (donem) => (
        <Tag color={donemRenkleri[donem]}>{donemEtiketleri[donem]}</Tag>
      )
    },
    {
      title: 'Yıl',
      dataIndex: 'yil',
      key: 'yil',
    },
    {
      title: 'Kredi',
      dataIndex: 'kredi',
      key: 'kredi',
    },
    {
      title: 'Not',
      dataIndex: 'notu',
      key: 'notu',
      render: (not) => {
        if (not === null) return '-';
        const notBilgisi = notDönüşümTablosu.find(n => n.katsayı === not);
        return (
          <Tag color={getNotRengi(not)}>
            {notBilgisi ? `${notBilgisi.harf} (${not.toFixed(2)})` : not.toFixed(2)}
          </Tag>
        );
      }
    },
    {
      title: 'Öğretim Üyesi',
      key: 'ogretmen',
      render: (_, record) => {
        if (!record.ogretmen_adi) return '-';
        return `${record.ogretmen_unvan} ${record.ogretmen_adi} ${record.ogretmen_soyad}`;
      }
    },
    {
      title: 'Bölüm',
      dataIndex: 'bolum_adi',
      key: 'bolum_adi',
    }
  ];

  return (
    <Card title="Derslerim">
      <Table 
        columns={coursesColumns} 
        dataSource={courses}
        rowKey={(record) => `${record.ders_kodu}-${record.yil}-${record.donem}`}
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Toplam ${total} ders`
        }}
      />
    </Card>
  );
};

export default Derslerim; 