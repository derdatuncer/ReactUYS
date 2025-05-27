import React, { useState, useEffect } from 'react';
import { Table, Input, Space, Button, Popconfirm, message, Modal, Form } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const BolumListesi = () => {
  const [bolumler, setBolumler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [editingBolum, setEditingBolum] = useState(null);
  const [form] = Form.useForm();

  const fetchBolumler = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/bolum/liste');
      setBolumler(response.data);
    } catch (error) {
      message.error('Bölüm listesi alınırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBolumler();
  }, []);

  const handleDelete = async (bolumId) => {
    try {
      await axios.delete(`http://localhost:5000/api/bolum/sil/${bolumId}`);
      message.success('Bölüm başarıyla silindi.');
      fetchBolumler();
    } catch (error) {
      message.error(error.response?.data?.message || 'Bölüm silinirken bir hata oluştu.');
    }
  };

  const handleEdit = (record) => {
    setEditingBolum(record);
    form.setFieldsValue({
      ad: record.ad,
      fakulte: record.fakulte
    });
  };

  const handleUpdate = async (values) => {
    try {
      await axios.put(`http://localhost:5000/api/bolum/guncelle/${editingBolum.bolum_id}`, values);
      message.success('Bölüm başarıyla güncellendi.');
      setEditingBolum(null);
      form.resetFields();
      fetchBolumler();
    } catch (error) {
      message.error(error.response?.data?.message || 'Bölüm güncellenirken bir hata oluştu.');
    }
  };

  const columns = [
    {
      title: 'Bölüm Adı',
      dataIndex: 'ad',
      key: 'ad',
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => 
        record.ad.toLowerCase().includes(value.toLowerCase()) ||
        record.fakulte.toLowerCase().includes(value.toLowerCase())
    },
    {
      title: 'Fakülte',
      dataIndex: 'fakulte',
      key: 'fakulte'
    },
    {
      title: 'İşlemler',
      key: 'islemler',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="primary" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Düzenle
          </Button>
          <Popconfirm
            title="Bölümü silmek istediğinize emin misiniz?"
            onConfirm={() => handleDelete(record.bolum_id)}
            okText="Evet"
            cancelText="Hayır"
          >
            <Button 
              type="primary"
              danger
              icon={<DeleteOutlined />}
            >
              Sil
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const filteredData = bolumler.filter(item => {
    const searchLower = searchText.toLowerCase();
    return (
      item.ad.toLowerCase().includes(searchLower) ||
      item.fakulte.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Bölüm adı veya fakülte ile ara..."
          prefix={<SearchOutlined />}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 300 }}
          allowClear
        />
      </div>
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="bolum_id"
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total} bölüm`
        }}
      />

      <Modal
        title="Bölüm Düzenle"
        open={editingBolum !== null}
        onCancel={() => {
          setEditingBolum(null);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdate}
        >
          <Form.Item
            name="ad"
            label="Bölüm Adı"
            rules={[{ required: true, message: 'Lütfen bölüm adını giriniz!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="fakulte"
            label="Fakülte"
            rules={[{ required: true, message: 'Lütfen fakülte adını giriniz!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Güncelle
              </Button>
              <Button onClick={() => {
                setEditingBolum(null);
                form.resetFields();
              }}>
                İptal
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BolumListesi; 