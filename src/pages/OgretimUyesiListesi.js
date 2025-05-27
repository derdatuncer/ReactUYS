import React, { useState, useEffect } from 'react';
import { Table, message, Input, Button, Space, Modal, Form, Select, Popconfirm, Card } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const OgretimUyesiListesi = () => {
  const [ogretimUyeleri, setOgretimUyeleri] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [form] = Form.useForm();
  const [bolumler, setBolumler] = useState([]);
  const [dersler, setDersler] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOgretimUyesi, setSelectedOgretimUyesi] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ogretimUyeleriRes, bolumlerRes, derslerRes] = await Promise.all([
          axios.get('http://localhost:5000/api/ogretim-uyesi/liste'),
          axios.get('http://localhost:5000/api/bolumler'),
          axios.get('http://localhost:5000/api/ders/liste')
        ]);
        setOgretimUyeleri(ogretimUyeleriRes.data);
        setBolumler(bolumlerRes.data);
        setDersler(derslerRes.data);
      } catch (error) {
        message.error('Veriler yüklenirken hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTableChange = (pagination, filters, sorter) => {
    setFilters(filters);
  };

  const handleEdit = (record) => {
    setSelectedOgretimUyesi(record);
    form.setFieldsValue({
      ...record,
      eski_ad: record.ad,
      eski_soyad: record.soyad,
      dersler: record.ders_kodlari ? record.ders_kodlari.split(',') : []
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (ogretmen_id) => {
    try {
      await axios.delete(`http://localhost:5000/api/ogretim-uyesi/sil/${ogretmen_id}`);
      message.success('Öğretim üyesi başarıyla silindi.');
      fetchOgretimUyeleri();
    } catch (error) {
      message.error('Öğretim üyesi silinirken hata oluştu.');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const response = await axios.put(
        `http://localhost:5000/api/ogretim-uyesi/guncelle/${selectedOgretimUyesi.ogretmen_id}`,
        {
          ...values,
          eski_ad: selectedOgretimUyesi.ad,
          eski_soyad: selectedOgretimUyesi.soyad
        }
      );
      message.success('Öğretim üyesi başarıyla güncellendi.');
      if (response.data.yeni_kullanici_adi) {
        message.info(`Yeni kullanıcı adı: ${response.data.yeni_kullanici_adi}`);
      }
      setIsModalVisible(false);
      fetchOgretimUyeleri();
    } catch (error) {
      message.error('Öğretim üyesi güncellenirken hata oluştu.');
    }
  };

  const fetchOgretimUyeleri = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/ogretim-uyesi/liste');
      setOgretimUyeleri(response.data);
    } catch (error) {
      message.error('Öğretim üyesi listesi yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const unvanlar = [
    { text: 'Prof. Dr.', value: 'Prof. Dr.' },
    { text: 'Doç. Dr.', value: 'Doç. Dr.' },
    { text: 'Dr. Öğr. Üyesi', value: 'Dr. Öğr. Üyesi' },
    { text: 'Öğr. Gör. Dr.', value: 'Öğr. Gör. Dr.' },
    { text: 'Öğr. Gör.', value: 'Öğr. Gör.' },
    { text: 'Arş. Gör. Dr.', value: 'Arş. Gör. Dr.' },
    { text: 'Arş. Gör.', value: 'Arş. Gör.' }
  ];

  const columns = [
    {
      title: 'Ad',
      dataIndex: 'ad',
      key: 'ad',
      filteredValue: filters.ad || null,
      onFilter: (value, record) => {
        const searchValue = value.toLowerCase();
        return (
          record.ad.toLowerCase().includes(searchValue) ||
          record.soyad.toLowerCase().includes(searchValue)
        );
      },
    },
    {
      title: 'Soyad',
      dataIndex: 'soyad',
      key: 'soyad',
    },
    {
      title: 'E-posta',
      dataIndex: 'e_posta',
      key: 'e_posta',
    },
    {
      title: 'Unvan',
      dataIndex: 'unvan',
      key: 'unvan',
      filteredValue: filters.unvan || null,
      filters: unvanlar,
      onFilter: (value, record) => record.unvan === value,
    },
    {
      title: 'Bölüm',
      dataIndex: 'bolum_adi',
      key: 'bolum_adi',
      filteredValue: filters.bolum_adi || null,
      filters: bolumler.map(bolum => ({ text: bolum.ad, value: bolum.bolum_id.toString() })),
      onFilter: (value, record) => record.bolum_id.toString() === value,
    },
    {
      title: 'Verdiği Dersler',
      key: 'dersler',
      render: (_, record) => {
        if (!record.ders_adi) return '-';
        const dersListesi = record.ders_adi.split(',');
        const dersKodlari = record.ders_kodlari.split(',');
        return dersListesi.map((ders, index) => (
          <div key={index}>{dersKodlari[index]} - {ders}</div>
        ));
      },
    },
    {
      title: 'İşlemler',
      key: 'islemler',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Düzenle
          </Button>
          <Popconfirm
            title="Bu öğretim üyesini silmek istediğinizden emin misiniz?"
            onConfirm={() => handleDelete(record.ogretmen_id)}
            okText="Evet"
            cancelText="Hayır"
          >
            <Button type="primary" danger icon={<DeleteOutlined />}>
              Sil
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Öğretim Üyesi Ara (Ad, Soyad)"
          prefix={<SearchOutlined />}
          onChange={e => {
            setFilters(prev => ({
              ...prev,
              ad: e.target.value ? [e.target.value] : null
            }));
          }}
          style={{ width: 300 }}
        />
      </div>
      <Card title="Öğretim Üyeleri">
        <Table
          columns={columns}
          dataSource={ogretimUyeleri}
          rowKey="ogretmen_id"
          loading={loading}
          onChange={handleTableChange}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Toplam ${total} öğretim üyesi`,
          }}
        />
      </Card>

      <Modal
        title="Öğretim Üyesi Düzenle"
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
        >
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
            name="unvan"
            label="Unvan"
            rules={[{ required: true, message: 'Lütfen unvanı seçiniz!' }]}
          >
            <Select options={unvanlar} />
          </Form.Item>

          <Form.Item
            name="bolum_id"
            label="Bölüm"
            rules={[{ required: true, message: 'Lütfen bölümü seçiniz!' }]}
          >
            <Select>
              {bolumler.map(bolum => (
                <Option key={bolum.bolum_id} value={bolum.bolum_id}>
                  {bolum.ad}
                </Option>
              ))}
            </Select>
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
        </Form>
      </Modal>
    </div>
  );
};

export default OgretimUyesiListesi; 