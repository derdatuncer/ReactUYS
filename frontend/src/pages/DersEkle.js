import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, message, Card, Space } from 'antd';
import axios from 'axios';

const DersEkle = () => {
  const [form] = Form.useForm();
  const [bolumler, setBolumler] = useState([]);
  const [dersler, setDersler] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBolumler();
    fetchDersler();
  }, []);

  const fetchBolumler = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/bolumler');
      setBolumler(response.data);
    } catch (error) {
      message.error('Bölümler yüklenirken bir hata oluştu.');
    }
  };

  const fetchDersler = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/ders/liste');
      setDersler(response.data);
    } catch (error) {
      message.error('Dersler yüklenirken bir hata oluştu.');
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Önce dersi ekle
      const dersResponse = await axios.post('http://localhost:5000/api/ders/ekle', {
        ders_kodu: values.ders_kodu,
        ad: values.ad,
        kredi: values.kredi,
        bolum_id: values.bolum_id,
        donem: values.donem,
        zorunlu_mu: values.zorunlu_mu
      });

      // Eğer ön koşul dersleri seçildiyse, onları ekle
      if (values.on_kosullar && values.on_kosullar.length > 0) {
        await Promise.all(values.on_kosullar.map(on_kosul_kodu =>
          axios.post('http://localhost:5000/api/ders/on-kosul-ekle', {
            ders_kodu: values.ders_kodu,
            on_kosul_kodu: on_kosul_kodu
          })
        ));
      }

      message.success('Ders başarıyla eklendi.');
      form.resetFields();
      fetchDersler(); // Ders listesini güncelle
    } catch (error) {
      message.error(error.response?.data?.message || 'Ders eklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card 
      title="Yeni Ders Ekle" 
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
        onFinish={onFinish}
        initialValues={{ zorunlu_mu: true }}
      >
        <Form.Item
          name="ders_kodu"
          label="Ders Kodu"
          rules={[{ required: true, message: 'Lütfen ders kodunu giriniz!' }]}
        >
          <Input placeholder="Örn: BLM101" />
        </Form.Item>

        <Form.Item
          name="ad"
          label="Ders Adı"
          rules={[{ required: true, message: 'Lütfen ders adını giriniz!' }]}
        >
          <Input placeholder="Örn: Programlama" />
        </Form.Item>

        <Form.Item
          name="kredi"
          label="Kredi"
          rules={[{ required: true, message: 'Lütfen kredi sayısını giriniz!' }]}
        >
          <InputNumber min={1} max={10} style={{ width: '100%' }} />
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
          name="donem"
          label="Dönem"
          rules={[{ required: true, message: 'Lütfen dönem seçiniz!' }]}
        >
          <Select
            placeholder="Dönem seçiniz"
            options={[
              { value: 'GUZ', label: 'Güz' },
              { value: 'BAHAR', label: 'Bahar' },
              { value: 'YAZ', label: 'Yaz' }
            ]}
          />
        </Form.Item>

        <Form.Item
          name="zorunlu_mu"
          label="Zorunlu mu?"
          valuePropName="checked"
          initialValue={true}
        >
          <Select
            options={[
              { value: true, label: 'Evet' },
              { value: false, label: 'Hayır' }
            ]}
          />
        </Form.Item>

        <Form.Item
          name="on_kosullar"
          label="Ön Koşul Dersler"
          help="Bu dersi alabilmek için başarıyla tamamlanması gereken dersleri seçin"
        >
          <Select
            mode="multiple"
            placeholder="Ön koşul dersleri seçiniz"
            style={{ width: '100%' }}
            optionFilterProp="children"
          >
            {dersler.map(ders => (
              <Select.Option key={ders.ders_kodu} value={ders.ders_kodu}>
                {ders.ders_kodu} - {ders.ad}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Ders Ekle
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default DersEkle; 