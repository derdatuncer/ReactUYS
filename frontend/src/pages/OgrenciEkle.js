import React, { useState, useEffect } from 'react';
import { Form, Input, Select, Button, message, Card } from 'antd';
import axios from 'axios';

const { Option } = Select;

const OgrenciEkle = () => {
  const [form] = Form.useForm();
  const [bolumler, setBolumler] = useState([]);
  const [loading, setLoading] = useState(false);
  const [kullaniciBilgileri, setKullaniciBilgileri] = useState(null);

  useEffect(() => {
    const fetchBolumler = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/bolumler');
        setBolumler(response.data);
      } catch (error) {
        message.error('Bölümler yüklenirken hata oluştu.');
      }
    };
    fetchBolumler();
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/ogrenci/ekle', values);
      message.success('Öğrenci başarıyla eklendi.');
      setKullaniciBilgileri({
        kullanici_adi: response.data.kullanici_adi,
        sifre: values.ogrenci_no
      });
      form.resetFields();
    } catch (error) {
      message.error('Öğrenci eklenirken hata oluştu.');
    }
    setLoading(false);
  };

  return (
    <Card title="Yeni Öğrenci Ekle" style={{ maxWidth: 800, margin: '100px auto' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          name="ogrenci_no"
          label="Öğrenci Numarası"
          rules={[{ required: true, message: 'Lütfen öğrenci numarasını giriniz!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="ad"
          label="Ad"
          rules={[{ required: true, message: 'Lütfen adı giriniz!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="soyad"
          label="Soyad"
          rules={[{ required: true, message: 'Lütfen soyadı giriniz!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="e_posta"
          label="E-posta"
          rules={[
            { required: true, message: 'Lütfen e-posta adresini giriniz!' },
            { type: 'email', message: 'Geçerli bir e-posta adresi giriniz!' }
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="telefon"
          label="Telefon"
          rules={[{ required: true, message: 'Lütfen telefon numarasını giriniz!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="sinif"
          label="Sınıf"
          rules={[{ required: true, message: 'Lütfen sınıfı seçiniz!' }]}
        >
          <Select>
            <Option value="1">1. Sınıf</Option>
            <Option value="2">2. Sınıf</Option>
            <Option value="3">3. Sınıf</Option>
            <Option value="4">4. Sınıf</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="bolum_id"
          label="Bölüm"
          rules={[{ required: true, message: 'Lütfen bölümü seçiniz!' }]}
        >
          <Select loading={bolumler.length === 0}>
            {bolumler.map(bolum => (
              <Option key={bolum.bolum_id} value={bolum.bolum_id}>
                {bolum.ad}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Öğrenci Ekle
          </Button>
        </Form.Item>
      </Form>

      {kullaniciBilgileri && (
        <Card title="Kullanıcı Bilgileri" style={{ marginTop: 24 }}>
          <p><strong>Kullanıcı Adı:</strong> {kullaniciBilgileri.kullanici_adi}</p>
          <p><strong>Şifre:</strong> {kullaniciBilgileri.sifre}</p>
          <p style={{ color: 'red' }}>Bu bilgileri not alın! Öğrenci bu bilgilerle sisteme giriş yapabilir.</p>
        </Card>
      )}
    </Card>
  );
};

export default OgrenciEkle; 