import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Tabs } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import axios from 'axios';

const { TabPane } = Tabs;

const Ayarlar = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData?.kullanici_id) {
        message.error('Geçersiz kullanıcı bilgisi. Lütfen tekrar giriş yapın.');
        return;
      }
      setUser(userData);
    } catch (error) {
      message.error('Kullanıcı bilgisi alınırken bir hata oluştu. Lütfen tekrar giriş yapın.');
    }
  }, []);

  const handleUsernameUpdate = async (values) => {
    if (!user) {
      message.error('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }
    try {
      setLoading(true);
      await axios.put('http://localhost:5000/api/kullanici/kullanici-adi-degistir', {
        yeni_kullanici_adi: values.yeni_kullanici_adi,
        mevcut_sifre: values.mevcut_sifre,
        user
      });

      message.success('Kullanıcı adı başarıyla güncellendi.');
      localStorage.setItem('user', JSON.stringify({ ...user, kullanici_adi: values.yeni_kullanici_adi }));
      form.resetFields();
    } catch (error) {
      message.error(error.response?.data?.message || 'Güncelleme sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values) => {
    if (!user) {
      message.error('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      return;
    }
    try {
      setLoading(true);
      await axios.put('http://localhost:5000/api/kullanici/sifre-degistir', {
        mevcut_sifre: values.mevcut_sifre,
        yeni_sifre: values.yeni_sifre,
        user
      });

      message.success('Şifreniz başarıyla değiştirildi.');
      passwordForm.resetFields();
    } catch (error) {
      message.error(error.response?.data?.message || 'Şifre değiştirme sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Ayarlar" style={{ maxWidth: 800, margin: '24px auto' }}>
      <Tabs defaultActiveKey="1">
        <TabPane tab="Kullanıcı Adı Değiştir" key="1">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUsernameUpdate}
            style={{ maxWidth: 400, margin: '0 auto' }}
          >
            <Form.Item
              name="yeni_kullanici_adi"
              label="Yeni Kullanıcı Adı"
              rules={[
                { required: true, message: 'Lütfen yeni kullanıcı adınızı giriniz!' },
                { min: 3, message: 'Kullanıcı adı en az 3 karakter olmalıdır!' }
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Yeni kullanıcı adınız" />
            </Form.Item>

            <Form.Item
              name="mevcut_sifre"
              label="Mevcut Şifre"
              rules={[{ required: true, message: 'Lütfen mevcut şifrenizi giriniz!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Mevcut şifreniz" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Kullanıcı Adını Değiştir
              </Button>
            </Form.Item>
          </Form>
        </TabPane>

        <TabPane tab="Şifre Değiştir" key="2">
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordChange}
            style={{ maxWidth: 400, margin: '0 auto' }}
          >
            <Form.Item
              name="mevcut_sifre"
              label="Mevcut Şifre"
              rules={[{ required: true, message: 'Lütfen mevcut şifrenizi giriniz!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Mevcut şifreniz" />
            </Form.Item>

            <Form.Item
              name="yeni_sifre"
              label="Yeni Şifre"
              rules={[
                { required: true, message: 'Lütfen yeni şifrenizi giriniz!' },
                { min: 6, message: 'Şifre en az 6 karakter olmalıdır!' }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Yeni şifreniz" />
            </Form.Item>

            <Form.Item
              name="yeni_sifre_tekrar"
              label="Yeni Şifre (Tekrar)"
              dependencies={['yeni_sifre']}
              rules={[
                { required: true, message: 'Lütfen yeni şifrenizi tekrar giriniz!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('yeni_sifre') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Şifreler eşleşmiyor!'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Yeni şifrenizi tekrar giriniz" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Şifreyi Değiştir
              </Button>
            </Form.Item>
          </Form>
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default Ayarlar; 