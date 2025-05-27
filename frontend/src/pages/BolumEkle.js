import React, { useState } from 'react';
import { Form, Input, Button, message, Card } from 'antd';
import axios from 'axios';

const BolumEkle = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      await axios.post('http://localhost:5000/api/bolum/ekle', values);
      message.success('Bölüm başarıyla eklendi.');
      form.resetFields();
    } catch (error) {
      message.error(error.response?.data?.message || 'Bölüm eklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title="Yeni Bölüm Ekle" 
      style={{ 
        width: '100%', 
        maxWidth: 600,
        margin: '100px auto',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="ad"
          label="Bölüm Adı"
          rules={[{ required: true, message: 'Lütfen bölüm adını giriniz!' }]}
        >
          <Input placeholder="Örn: Bilgisayar Mühendisliği" />
        </Form.Item>

        <Form.Item
          name="fakulte"
          label="Fakülte"
          rules={[{ required: true, message: 'Lütfen fakülte adını giriniz!' }]}
        >
          <Input placeholder="Örn: Mühendislik Fakültesi" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Bölüm Ekle
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default BolumEkle; 