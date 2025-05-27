import React, { useState } from 'react';
import { Form, Input, Button, message, Card } from 'antd';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/login', values);
      const userData = {
        kullanici_adi: res.data.kullanici_adi,
        kullanici_id: res.data.kullanici_id,
        rol: res.data.rol
      };
      
      // Kullanıcı bilgilerini localStorage'a kaydet
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Axios için varsayılan header'ı ayarla
      axios.defaults.headers.common['x-user'] = userData.kullanici_adi;
      
      message.success('Giriş başarılı!');
      
      // Rol bazlı yönlendirme
      switch (userData.rol) {
        case 'ogrenci':
          navigate('/ogrenci');
          break;
        case 'ogretim_gorevlisi':
          navigate('/akademi');
          break;
        case 'yonetici':
          navigate('/admin');
          break;
        default:
          navigate('/');
      }
      
      onLogin(userData.kullanici_adi);
    } catch (err) {
      message.error(
        err.response?.data?.message || 'Giriş başarısız!'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5' }}>
      <Card title="Üniversite Yönetim Sistemi Giriş" style={{ width: 350 }}>
        <Form name="login" onFinish={onFinish} layout="vertical">
          <Form.Item name="kullanici_adi" label="Kullanıcı Adı" rules={[{ required: true, message: 'Kullanıcı adı giriniz!' }]}> 
            <Input placeholder="ogrenci_123, gorevli_456, admin_1..." />
          </Form.Item>
          <Form.Item name="sifre" label="Şifre" rules={[{ required: true, message: 'Şifre giriniz!' }]}> 
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Giriş Yap
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login; 