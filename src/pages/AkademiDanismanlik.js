import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, message } from 'antd';
import axios from 'axios';

const AkademiDanismanlik = () => {
  const [ogrenciler, setOgrenciler] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOgrenciler();
  }, []);

  const fetchOgrenciler = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData?.kullanici_adi) {
        message.error('Kullanıcı bilgisi bulunamadı.');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/academic/danismanlik-ogrencileri');
      setOgrenciler(response.data);
    } catch (error) {
      message.error('Danışmanlık öğrencileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Öğrenci No',
      dataIndex: 'ogrenci_no',
      key: 'ogrenci_no',
      width: 120,
    },
    {
      title: 'Ad',
      dataIndex: 'ad',
      key: 'ad',
      width: 150,
    },
    {
      title: 'Soyad',
      dataIndex: 'soyad',
      key: 'soyad',
      width: 150,
    },
    {
      title: 'Bölüm',
      dataIndex: 'bolum_adi',
      key: 'bolum_adi',
      width: 200,
    },
    {
      title: 'Sınıf',
      dataIndex: 'sinif',
      key: 'sinif',
      width: 100,
    },
    {
      title: 'Durum',
      dataIndex: 'statu',
      key: 'statu',
      width: 120,
      render: (statu) => (
        <Tag color={statu === 'aktif' ? 'green' : 'red'}>
          {statu === 'aktif' ? 'AKTİF' : 'PASİF'}
        </Tag>
      ),
    },
    {
      title: 'GANO',
      dataIndex: 'gano',
      key: 'gano',
      width: 100,
      render: (gano) => gano ? gano.toFixed(2) : '-',
    },
    {
      title: 'E-posta',
      dataIndex: 'e_posta',
      key: 'e_posta',
      width: 200,
    },
    {
      title: 'Telefon',
      dataIndex: 'telefon',
      key: 'telefon',
      width: 150,
    },
  ];

  return (
    <Card title="Danışmanlık Öğrencilerim">
      <Table
        columns={columns}
        dataSource={ogrenciler}
        rowKey="ogrenci_no"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Toplam ${total} öğrenci`,
        }}
        scroll={{ x: 'max-content' }}
      />
    </Card>
  );
};

export default AkademiDanismanlik; 