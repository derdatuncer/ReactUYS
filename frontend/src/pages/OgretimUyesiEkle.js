import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, message, Card } from 'antd';
import axios from 'axios';

const { Option } = Select;

const OgretimUyesiEkle = () => {
  const [bolumler, setBolumler] = useState([]);
  const [dersler, setDersler] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bolumlerRes, derslerRes] = await Promise.all([
          axios.get('http://localhost:5000/api/bolum/liste'),
          axios.get('http://localhost:5000/api/ders/liste')
        ]);
        setBolumler(bolumlerRes.data);
        setDersler(derslerRes.data);
      } catch (error) {
        message.error('Veriler yüklenirken bir hata oluştu.');
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (values) => {
    try {
      await axios.post('http://localhost:5000/api/ogretim-uyesi/ekle', values);
      message.success('Öğretim üyesi başarıyla eklendi.');
      form.resetFields();
    } catch (error) {
      message.error(error.response?.data?.message || 'Kaydetme sırasında bir hata oluştu.');
    }
  };

  const unvanlar = [
    { value: 'Prof. Dr.', label: 'Prof. Dr.' },
    { value: 'Doç. Dr.', label: 'Doç. Dr.' },
    { value: 'Dr. Öğr. Üyesi', label: 'Dr. Öğr. Üyesi' },
    { value: 'Öğr. Gör. Dr.', label: 'Öğr. Gör. Dr.' },
    { value: 'Öğr. Gör.', label: 'Öğr. Gör.' },
    { value: 'Arş. Gör. Dr.', label: 'Arş. Gör. Dr.' },
    { value: 'Arş. Gör.', label: 'Arş. Gör.' }
  ];

  return (
    <Card title="Öğretim Üyesi Ekle" style={{ maxWidth: 800, margin: '100px auto' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="ad"
          label="Ad"
          rules={[{ required: true, message: 'Lütfen ad giriniz!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="soyad"
          label="Soyad"
          rules={[{ required: true, message: 'Lütfen soyad giriniz!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="e_posta"
          label="E-posta"
          rules={[
            { required: true, message: 'Lütfen e-posta giriniz!' },
            { type: 'email', message: 'Geçerli bir e-posta adresi giriniz!' }
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="unvan"
          label="Unvan"
          rules={[{ required: true, message: 'Lütfen unvan seçiniz!' }]}
        >
          <Select placeholder="Unvan seçiniz" options={unvanlar} />
        </Form.Item>

        <Form.Item
          name="bolum_id"
          label="Bölüm"
          rules={[{ required: true, message: 'Lütfen bölüm seçiniz!' }]}
        >
          <Select
            placeholder="Bölüm seçiniz"
            options={bolumler.map(bolum => ({
              value: bolum.bolum_id,
              label: bolum.ad
            }))}
          />
        </Form.Item>

        <Form.Item
          name="dersler"
          label="Vereceği Dersler"
        >
          <Select
            mode="multiple"
            placeholder="Ders seçiniz"
            options={dersler.map(ders => ({
              value: ders.ders_kodu,
              label: `${ders.ders_kodu} - ${ders.ad}`
            }))}
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Ekle
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default OgretimUyesiEkle; 