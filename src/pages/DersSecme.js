import React, { useState, useEffect } from 'react';
import { Card, Table, Button, message, Tag, Space, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const DersSecme = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [prerequisites, setPrerequisites] = useState({});

  const fetchCourses = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData?.kullanici_adi) {
        message.error('Kullanıcı bilgisi bulunamadı.');
        return;
      }

      const response = await axios.get('http://localhost:5000/api/student/current-semester-courses');
      setCourses(response.data);

      // Her ders için ön koşulları al
      const prerequisitePromises = response.data.map(course =>
        axios.get(`http://localhost:5000/api/ders/on-kosullar/${course.ders_kodu}`)
      );

      const prerequisiteResults = await Promise.all(prerequisitePromises);
      const prerequisiteMap = {};
      prerequisiteResults.forEach((result, index) => {
        prerequisiteMap[response.data[index].ders_kodu] = result.data;
      });
      setPrerequisites(prerequisiteMap);
    } catch (error) {
      message.error('Dersler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleRegisterCourse = async (dersKodu) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      await axios.post('http://localhost:5000/api/student/register-course', {
        ders_kodu: dersKodu
      });
      message.success('Ders başarıyla kaydedildi');
      fetchCourses();
    } catch (error) {
      if (error.response?.data?.missingPrerequisites) {
        const missingCourses = error.response.data.missingPrerequisites
          .map(course => `${course.ders_kodu} - ${course.ad}`)
          .join('\n');
        message.error(
          <div>
            <p>{error.response.data.message}</p>
            <p>Eksik ön koşul dersleri:</p>
            <pre>{missingCourses}</pre>
          </div>
        );
      } else {
        message.error(error.response?.data?.message || 'Ders kaydedilirken bir hata oluştu');
      }
    }
  };

  const handleDropCourse = async (dersKodu) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      await axios.delete(`http://localhost:5000/api/student/drop-course/${dersKodu}`);
      message.success('Ders başarıyla bırakıldı');
      fetchCourses();
    } catch (error) {
      message.error(error.response?.data?.message || 'Ders bırakılırken bir hata oluştu');
    }
  };

  const donemRenkleri = {
    'GUZ': 'blue',
    'BAHAR': 'green',
    'YAZ': 'orange'
  };

  const columns = [
    {
      title: 'Ders Kodu',
      dataIndex: 'ders_kodu',
      key: 'ders_kodu',
    },
    {
      title: 'Ders Adı',
      dataIndex: 'ad',
      key: 'ad',
    },
    {
      title: 'Kredi',
      dataIndex: 'kredi',
      key: 'kredi',
    },
    {
      title: 'Dönem',
      dataIndex: 'donem',
      key: 'donem',
      render: (text) => <Tag color={donemRenkleri[text]}>{text}</Tag>
    },
    {
      title: 'Ön Koşullar',
      key: 'on_kosullar',
      render: (_, record) => {
        const coursePrerequisites = prerequisites[record.ders_kodu] || [];
        if (coursePrerequisites.length === 0) {
          return 'Ön koşul yok';
        }
        return (
          <Tooltip title={coursePrerequisites.map(p => `${p.ders_kodu} - ${p.ad}`).join('\n')}>
            <Space>
              <InfoCircleOutlined />
              {coursePrerequisites.length} ön koşul
            </Space>
          </Tooltip>
        );
      }
    },
    {
      title: 'Öğretim Üyesi',
      dataIndex: 'ogretmen_adi',
      key: 'ogretmen_adi',
    },
    {
      title: 'Derslik',
      key: 'derslik',
      render: (_, record) => `${record.bina} - ${record.kat}. Kat`
    },
    {
      title: 'Gün/Saat',
      key: 'gun_saat',
      render: (_, record) => `${record.gun} ${record.saat}`
    },
    {
      title: 'İşlemler',
      key: 'islemler',
      render: (_, record) => (
        <Space>
          {record.kayitli ? (
            <Button 
              type="primary" 
              danger 
              onClick={() => handleDropCourse(record.ders_kodu)}
            >
              Dersi Bırak
            </Button>
          ) : (
            <Button 
              type="primary" 
              onClick={() => handleRegisterCourse(record.ders_kodu)}
            >
              Derse Kaydol
            </Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <Card title="Ders Seçme" style={{ padding: '24px' }}>
      <Table
        columns={columns}
        dataSource={courses}
        loading={loading}
        rowKey="ders_kodu"
      />
    </Card>
  );
};

export default DersSecme; 