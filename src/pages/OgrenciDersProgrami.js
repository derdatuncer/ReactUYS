import React, { useState, useEffect } from 'react';
import { Card, Table, message } from 'antd';
import axios from 'axios';

const OgrenciDersProgrami = () => {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  const gunler = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma'];
  const saatler = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'];

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData?.kullanici_adi) {
          message.error('Kullanıcı bilgisi bulunamadı.');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/student/schedule');
        setSchedule(response.data);
      } catch (error) {
        message.error('Ders programı yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const columns = [
    {
      title: 'Saat',
      dataIndex: 'saat',
      key: 'saat',
      width: 100,
      fixed: 'left',
    },
    ...gunler.map(gun => ({
      title: gun,
      dataIndex: gun.toLowerCase(),
      key: gun.toLowerCase(),
      render: (text, record) => {
        const ders = schedule.find(d => 
          d.gun === gun && d.saat.startsWith(record.saat)
        );
        
        if (!ders) return null;

        return (
          <div>
            <div style={{ fontWeight: 'bold' }}>{ders.ders_kodu}</div>
            <div>{ders.ders_adi}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {ders.bina} - {ders.kat}. Kat
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {ders.ogretmen_unvan} {ders.ogretmen_adi} {ders.ogretmen_soyad}
            </div>
          </div>
        );
      }
    }))
  ];

  const data = saatler.map(saat => ({
    key: saat,
    saat: saat,
    ...gunler.reduce((acc, gun) => {
      acc[gun.toLowerCase()] = null;
      return acc;
    }, {})
  }));

  return (
    <Card title="Ders Programım" style={{ padding: '24px' }}>
      <Table
        columns={columns}
        dataSource={data}
        pagination={false}
        loading={loading}
        scroll={{ x: 'max-content' }}
        bordered
      />
    </Card>
  );
};

export default OgrenciDersProgrami; 