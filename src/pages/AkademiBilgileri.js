import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Row, Col, Typography, Space, Modal } from 'antd';
import axios from 'axios';

const { Text } = Typography;

const AkademiBilgileri = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [sifreModalVisible, setSifreModalVisible] = useState(false);
  const [sifreDegistir, setSifreDegistir] = useState({
    eski_sifre: '',
    yeni_sifre: '',
    yeni_sifre_tekrar: ''
  });

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData?.kullanici_adi) {
        message.error('Kullanıcı bilgisi bulunamadı.');
        return;
      }

      const response = await axios.get(`http://localhost:5000/api/ogretim-uyesi/bilgiler/${userData.kullanici_adi}`);
      setUserInfo(response.data);
    } catch (error) {
      message.error('Kullanıcı bilgileri yüklenirken bir hata oluştu.');
    }
  };

  const handleSifreDegistir = async () => {
    if (sifreDegistir.yeni_sifre !== sifreDegistir.yeni_sifre_tekrar) {
      message.error('Yeni şifreler eşleşmiyor');
      return;
    }

    try {
      setLoading(true);
      const userData = JSON.parse(localStorage.getItem('user'));
      
      await axios.put('http://localhost:5000/api/kullanici/sifre-degistir', {
        mevcut_sifre: sifreDegistir.eski_sifre,
        yeni_sifre: sifreDegistir.yeni_sifre,
        user: userData
      });

      setSifreModalVisible(false);
      setSifreDegistir({ eski_sifre: '', yeni_sifre: '', yeni_sifre_tekrar: '' });
      message.success('Şifre başarıyla değiştirildi');
    } catch (error) {
      message.error(error.response?.data?.message || 'Şifre değiştirilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (!userInfo) {
    return <Text>Yükleniyor...</Text>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Kişisel Bilgiler">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text><strong>Ad Soyad:</strong> {userInfo.ad} {userInfo.soyad}</Text>
              <Text><strong>Unvan:</strong> {userInfo.unvan}</Text>
              <Text><strong>Bölüm:</strong> {userInfo.bolum_adi}</Text>
              <Text><strong>E-posta:</strong> {userInfo.e_posta}</Text>
              <Button type="primary" onClick={() => setSifreModalVisible(true)}>
                Şifre Değiştir
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Modal
        title="Şifre Değiştir"
        open={sifreModalVisible}
        onOk={handleSifreDegistir}
        onCancel={() => setSifreModalVisible(false)}
        confirmLoading={loading}
      >
        <Form layout="vertical">
          <Form.Item label="Eski Şifre">
            <Input.Password
              value={sifreDegistir.eski_sifre}
              onChange={(e) => setSifreDegistir({ ...sifreDegistir, eski_sifre: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="Yeni Şifre">
            <Input.Password
              value={sifreDegistir.yeni_sifre}
              onChange={(e) => setSifreDegistir({ ...sifreDegistir, yeni_sifre: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="Yeni Şifre (Tekrar)">
            <Input.Password
              value={sifreDegistir.yeni_sifre_tekrar}
              onChange={(e) => setSifreDegistir({ ...sifreDegistir, yeni_sifre_tekrar: e.target.value })}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AkademiBilgileri; 