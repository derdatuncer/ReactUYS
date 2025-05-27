import React, { useState, useEffect } from 'react';
import { Table, Button, Card, message, Space } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import axios from 'axios';

const DersProgrami = () => {
  const [bolumler, setBolumler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [programLoading, setProgramLoading] = useState(false);
  const [selectedBolum, setSelectedBolum] = useState(null);
  const [program, setProgram] = useState([]);

  useEffect(() => {
    const fetchBolumler = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/bolum/liste');
        setBolumler(response.data);
      } catch (error) {
        message.error('Bölüm listesi alınırken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchBolumler();
  }, []);

  const handleProgramOlustur = async (bolumId) => {
    try {
      setProgramLoading(true);
      await axios.post(`http://localhost:5000/api/ders-programi/olustur/${bolumId}`);
      message.success('Ders programı başarıyla oluşturuldu.');
      fetchProgram(bolumId);
    } catch (error) {
      message.error('Program oluşturulurken bir hata oluştu.');
    } finally {
      setProgramLoading(false);
    }
  };

  const fetchProgram = async (bolumId) => {
    try {
      setProgramLoading(true);
      const response = await axios.get(`http://localhost:5000/api/ders-programi/bolum/${bolumId}`);
      setProgram(response.data);
      setSelectedBolum(bolumId);
    } catch (error) {
      message.error('Program görüntülenirken bir hata oluştu.');
    } finally {
      setProgramLoading(false);
    }
  };

  const columns = [
    {
      title: 'Gün',
      dataIndex: 'gun',
      key: 'gun',
      fixed: 'left',
      width: 120,
    },
    {
      title: 'Saat',
      dataIndex: 'saat',
      key: 'saat',
      fixed: 'left',
      width: 100,
    },
    {
      title: 'Ders Kodu',
      dataIndex: 'ders_kodu',
      key: 'ders_kodu',
      width: 120,
    },
    {
      title: 'Ders Adı',
      dataIndex: 'ders_adi',
      key: 'ders_adi',
      width: 200,
    },
    {
      title: 'Derslik',
      key: 'derslik',
      width: 200,
      render: (_, record) => `${record.bina} - ${record.kat}. Kat - ${record.derslik_id}`,
    },
    {
      title: 'Öğretim Üyesi',
      key: 'ogretmen',
      width: 200,
      render: (_, record) => record.ogretmen_adi ? `${record.ogretmen_adi} ${record.ogretmen_soyad}` : '-',
    }
  ];

  return (
    <Card title="Bölüm Ders Programları" style={{ padding: '24px' }}>
      <Table
        columns={[
          {
            title: 'Bölüm Adı',
            dataIndex: 'ad',
            key: 'ad',
          },
          {
            title: 'Fakülte',
            dataIndex: 'fakulte',
            key: 'fakulte',
          },
          {
            title: 'İşlemler',
            key: 'islemler',
            render: (_, record) => (
              <Space>
                <Button
                  type="primary"
                  icon={<SyncOutlined spin={programLoading && selectedBolum === record.bolum_id} />}
                  onClick={() => handleProgramOlustur(record.bolum_id)}
                  loading={programLoading && selectedBolum === record.bolum_id}
                >
                  Program Oluştur
                </Button>
                <Button
                  type="primary"
                  onClick={() => fetchProgram(record.bolum_id)}
                  loading={programLoading && selectedBolum === record.bolum_id}
                >
                  Programı Görüntüle
                </Button>
              </Space>
            ),
          },
        ]}
        dataSource={bolumler}
        rowKey="bolum_id"
        loading={loading}
      />

      {selectedBolum && (
        <Card 
          title={`${bolumler.find(b => b.bolum_id === selectedBolum)?.ad} Bölümü Ders Programı`}
          style={{ marginTop: '24px' }}
        >
          <Table
            columns={columns}
            dataSource={program}
            rowKey={(record) => `${record.ders_kodu}-${record.derslik_id}-${record.gun}-${record.saat}`}
            loading={programLoading}
            scroll={{ x: 1200 }}
          />
        </Card>
      )}
    </Card>
  );
};

export default DersProgrami; 