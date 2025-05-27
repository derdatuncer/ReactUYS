import React, { useState, useEffect } from 'react';
import { Table, message, Input, Button, Space, Modal, Form, Select, Popconfirm } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const OgrenciListesi = () => {
  const [ogrenciler, setOgrenciler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({});
  const [form] = Form.useForm();
  const [bolumler, setBolumler] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOgrenci, setSelectedOgrenci] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ogrencilerRes, bolumlerRes] = await Promise.all([
          axios.get('http://localhost:5000/api/ogrenci/liste'),
          axios.get('http://localhost:5000/api/bolumler')
        ]);
        setOgrenciler(ogrencilerRes.data);
        setBolumler(bolumlerRes.data);
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
    setSelectedOgrenci(record);
    form.setFieldsValue({
      ...record,
      eski_ad: record.ad,
      eski_soyad: record.soyad
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (ogrenci_no) => {
    try {
      await axios.delete(`http://localhost:5000/api/ogrenci/sil/${ogrenci_no}`);
      message.success('Öğrenci başarıyla silindi.');
      fetchOgrenciler();
    } catch (error) {
      message.error('Öğrenci silinirken hata oluştu.');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const response = await axios.put(
        `http://localhost:5000/api/ogrenci/guncelle/${selectedOgrenci.ogrenci_no}`,
        {
          ...values,
          eski_ad: selectedOgrenci.ad,
          eski_soyad: selectedOgrenci.soyad
        }
      );
      message.success('Öğrenci başarıyla güncellendi.');
      if (response.data.yeni_kullanici_adi) {
        message.info(`Yeni kullanıcı adı: ${response.data.yeni_kullanici_adi}`);
      }
      setIsModalVisible(false);
      fetchOgrenciler();
    } catch (error) {
      message.error('Öğrenci güncellenirken hata oluştu.');
    }
  };

  const fetchOgrenciler = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/ogrenci/liste');
      setOgrenciler(response.data);
    } catch (error) {
      message.error('Öğrenci listesi yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Öğrenci No',
      dataIndex: 'ogrenci_no',
      key: 'ogrenci_no',
      filteredValue: filters.ogrenci_no || null,
      onFilter: (value, record) => {
        const searchValue = value.toLowerCase();
        return (
          record.ogrenci_no.toString().includes(searchValue) ||
          record.ad.toLowerCase().includes(searchValue) ||
          record.soyad.toLowerCase().includes(searchValue)
        );
      },
    },
    {
      title: 'Ad',
      dataIndex: 'ad',
      key: 'ad',
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
      title: 'Telefon',
      dataIndex: 'telefon',
      key: 'telefon',
    },
    {
      title: 'Sınıf',
      dataIndex: 'sinif',
      key: 'sinif',
      render: (sinif) => `${sinif}. Sınıf`,
      filteredValue: filters.sinif || null,
      filters: [
        { text: '1. Sınıf', value: '1' },
        { text: '2. Sınıf', value: '2' },
        { text: '3. Sınıf', value: '3' },
        { text: '4. Sınıf', value: '4' },
      ],
      onFilter: (value, record) => record.sinif.toString() === value,
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
      title: 'Durum',
      dataIndex: 'statu',
      key: 'statu',
      filteredValue: filters.statu || null,
      render: (statu) => statu === 'aktif' ? 'Aktif' : 'Pasif',
      filters: [
        { text: 'Aktif', value: 'aktif' },
        { text: 'Pasif', value: 'pasif' },
      ],
      onFilter: (value, record) => record.statu === value,
    },
    {
      title: 'Veli Bilgileri',
      key: 'veli',
      render: (_, record) => {
        if (!record.veli_id) return <span style={{ color: '#999' }}>Veli bilgisi yok</span>;
        
        return (
          <>
            <div><strong>Ad Soyad:</strong> {record.veli_ad} {record.veli_soyad}</div>
            <div><strong>Telefon:</strong> {record.veli_telefon || 'Belirtilmemiş'}</div>
            <div><strong>E-posta:</strong> {record.veli_e_posta || 'Belirtilmemiş'}</div>
          </>
        );
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
            title="Bu öğrenciyi silmek istediğinizden emin misiniz?"
            onConfirm={() => handleDelete(record.ogrenci_no)}
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
          placeholder="Öğrenci Ara (No, Ad, Soyad)"
          prefix={<SearchOutlined />}
          onChange={e => {
            setSearchText(e.target.value);
            setFilters(prev => ({
              ...prev,
              ogrenci_no: e.target.value ? [e.target.value] : null
            }));
          }}
          style={{ width: 300 }}
        />
      </div>
      <Table
        columns={columns}
        dataSource={ogrenciler}
        rowKey="ogrenci_no"
        loading={loading}
        onChange={handleTableChange}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Toplam ${total} öğrenci`,
        }}
      />

      <Modal
        title="Öğrenci Düzenle"
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
            <Select>
              {bolumler.map(bolum => (
                <Option key={bolum.bolum_id} value={bolum.bolum_id}>
                  {bolum.ad}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="statu"
            label="Durum"
            rules={[{ required: true, message: 'Lütfen durumu seçiniz!' }]}
          >
            <Select>
              <Option value="aktif">Aktif</Option>
              <Option value="pasif">Pasif</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OgrenciListesi; 