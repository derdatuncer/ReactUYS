import React, { useState, useEffect } from 'react';
import { Table, Input, Space, Button, message, Popconfirm, Modal, Form, InputNumber, Switch, Select, Tooltip, Tag } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, InfoCircleOutlined, CloseOutlined } from '@ant-design/icons';
import axios from 'axios';

const DersListesi = () => {
  const [dersler, setDersler] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingDers, setEditingDers] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [bolumler, setBolumler] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [prerequisites, setPrerequisites] = useState({});
  const [selectedPrerequisites, setSelectedPrerequisites] = useState([]);
  const [availablePrerequisites, setAvailablePrerequisites] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [derslerRes, bolumlerRes] = await Promise.all([
          axios.get('http://localhost:5000/api/ders/liste'),
          axios.get('http://localhost:5000/api/bolumler')
        ]);
        setDersler(derslerRes.data);
        setBolumler(bolumlerRes.data);

        // Her ders için ön koşulları al
        const prerequisitePromises = derslerRes.data.map(course =>
          axios.get(`http://localhost:5000/api/ders/on-kosullar/${course.ders_kodu}`)
        );

        const prerequisiteResults = await Promise.all(prerequisitePromises);
        const prerequisiteMap = {};
        prerequisiteResults.forEach((result, index) => {
          prerequisiteMap[derslerRes.data[index].ders_kodu] = result.data;
        });
        setPrerequisites(prerequisiteMap);
      } catch (error) {
        message.error('Veriler yüklenirken hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchData();
  }, []);

  const handleDelete = async (dersKodu) => {
    try {
      await axios.delete(`http://localhost:5000/api/ders/sil/${dersKodu}`);
      message.success('Ders başarıyla silindi.');
      fetchDersler();
    } catch (error) {
      message.error('Ders silinirken hata oluştu.');
    }
  };

  const handleEdit = (record) => {
    setEditingDers(record);
    form.setFieldsValue({
      ad: record.ad,
      kredi: record.kredi,
      bolum_id: record.bolum_id,
      donem: record.donem,
      zorunlu_mu: record.zorunlu_mu
    });
    
    // Mevcut ön koşulları ayarla
    const currentPrerequisites = prerequisites[record.ders_kodu] || [];
    setSelectedPrerequisites(currentPrerequisites);
    
    // Kullanılabilir ön koşulları ayarla (kendisi hariç)
    const available = dersler.filter(ders => 
      ders.ders_kodu !== record.ders_kodu && 
      !currentPrerequisites.some(p => p.on_kosul_kodu === ders.ders_kodu)
    );
    setAvailablePrerequisites(available);
    
    setModalVisible(true);
  };

  const handleAddPrerequisite = async (dersKodu) => {
    try {
      await axios.post('http://localhost:5000/api/ders/on-kosul-ekle', {
        ders_kodu: editingDers.ders_kodu,
        on_kosul_kodu: dersKodu
      });
      
      // Ön koşulları güncelle
      const updatedPrerequisites = [...selectedPrerequisites];
      const newPrerequisite = dersler.find(d => d.ders_kodu === dersKodu);
      updatedPrerequisites.push({
        on_kosul_kodu: dersKodu,
        ad: newPrerequisite.ad
      });
      setSelectedPrerequisites(updatedPrerequisites);
      
      // Kullanılabilir ön koşulları güncelle
      setAvailablePrerequisites(prev => prev.filter(d => d.ders_kodu !== dersKodu));
      
      message.success('Ön koşul başarıyla eklendi.');
    } catch (error) {
      message.error('Ön koşul eklenirken hata oluştu.');
    }
  };

  const handleRemovePrerequisite = async (onKosulKodu) => {
    try {
      await axios.delete('http://localhost:5000/api/ders/on-kosul-sil', {
        data: {
          ders_kodu: editingDers.ders_kodu,
          on_kosul_kodu: onKosulKodu
        }
      });
      
      // Ön koşulları güncelle
      const updatedPrerequisites = selectedPrerequisites.filter(p => p.on_kosul_kodu !== onKosulKodu);
      setSelectedPrerequisites(updatedPrerequisites);
      
      // Kullanılabilir ön koşulları güncelle
      const removedPrerequisite = dersler.find(d => d.ders_kodu === onKosulKodu);
      setAvailablePrerequisites(prev => [...prev, removedPrerequisite]);
      
      message.success('Ön koşul başarıyla kaldırıldı.');
    } catch (error) {
      message.error('Ön koşul kaldırılırken hata oluştu.');
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      await axios.put(`http://localhost:5000/api/ders/guncelle/${editingDers.ders_kodu}`, values);
      message.success('Ders başarıyla güncellendi.');
      setModalVisible(false);
      fetchDersler();
    } catch (error) {
      message.error('Ders güncellenirken hata oluştu.');
    }
  };

  const fetchDersler = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/ders/liste');
      setDersler(response.data);
    } catch (error) {
      message.error('Dersler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const filteredData = dersler.filter(item => {
    const searchLower = searchText.toLowerCase();
    return (
      (item.ders_kodu?.toLowerCase() || '').includes(searchLower) ||
      (item.ad?.toLowerCase() || '').includes(searchLower) ||
      (item.bolum_adi?.toLowerCase() || '').includes(searchLower)
    );
  });

  const columns = [
    {
      title: 'Ders Kodu',
      dataIndex: 'ders_kodu',
      key: 'ders_kodu',
    },
    {
      title: 'Ders Adı',
      dataIndex: 'ad',
      key: 'ad',
    },
    {
      title: 'Kredi',
      dataIndex: 'kredi',
      key: 'kredi',
    },
    {
      title: 'Bölüm',
      dataIndex: 'bolum_adi',
      key: 'bolum_adi',
    },
    {
      title: 'Dönem',
      dataIndex: 'donem',
      key: 'donem',
      filters: [
        { text: 'Güz', value: 'GUZ' },
        { text: 'Bahar', value: 'BAHAR' },
        { text: 'Yaz', value: 'YAZ' },
      ],
      onFilter: (value, record) => record.donem === value,
    },
    {
      title: 'Zorunlu',
      dataIndex: 'zorunlu_mu',
      key: 'zorunlu_mu',
      render: (zorunlu_mu) => zorunlu_mu ? 'Evet' : 'Hayır',
      filters: [
        { text: 'Evet', value: 1 },
        { text: 'Hayır', value: 0 },
      ],
      onFilter: (value, record) => record.zorunlu_mu === value,
    },
    {
      title: 'Ön Koşullar',
      key: 'on_kosullar',
      render: (_, record) => {
        const coursePrerequisites = prerequisites[record.ders_kodu] || [];
        if (coursePrerequisites.length === 0) {
          return 'Ön koşul yok';
        }
        return (
          <Tooltip 
            title={
              <div>
                {coursePrerequisites.map((p, index) => (
                  <div key={index}>
                    {p.ders_kodu} - {p.ad}
                  </div>
                ))}
              </div>
            }
          >
            <Space>
              <InfoCircleOutlined />
              {coursePrerequisites.length} ön koşul
            </Space>
          </Tooltip>
        );
      }
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
            title="Bu dersi silmek istediğinizden emin misiniz?"
            onConfirm={() => handleDelete(record.ders_kodu)}
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
      <h2>Ders Listesi</h2>
      <div style={{ marginBottom: 16 }}>
        <Input
          placeholder="Ders kodu, adı veya bölüm ara"
          allowClear
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
      </div>
      <Table
        columns={columns}
        dataSource={filteredData}
        rowKey="ders_kodu"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Toplam ${total} ders`,
        }}
      />

      <Modal
        title="Ders Düzenle"
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        okText="Kaydet"
        cancelText="İptal"
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="ad"
            label="Ders Adı"
            rules={[{ required: true, message: 'Lütfen ders adını giriniz!' }]}
          >
            <Input />
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
            rules={[{ required: true, message: 'Lütfen bölümü seçiniz!' }]}
          >
            <Select placeholder="Bölüm seçiniz">
              {bolumler.map(bolum => (
                <Select.Option key={bolum.bolum_id} value={bolum.bolum_id}>
                  {bolum.ad}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="donem"
            label="Dönem"
            rules={[{ required: true, message: 'Lütfen dönemi seçiniz!' }]}
          >
            <Select placeholder="Dönem seçiniz">
              <Select.Option value="GUZ">Güz</Select.Option>
              <Select.Option value="BAHAR">Bahar</Select.Option>
              <Select.Option value="YAZ">Yaz</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="zorunlu_mu"
            label="Zorunlu Ders"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item label="Ön Koşullar">
            <div style={{ marginBottom: 16 }}>
              <Select
                style={{ width: '100%' }}
                placeholder="Ön koşul ders seçiniz"
                onChange={handleAddPrerequisite}
                value={undefined}
              >
                {availablePrerequisites.map(ders => (
                  <Select.Option key={ders.ders_kodu} value={ders.ders_kodu}>
                    {ders.ders_kodu} - {ders.ad}
                  </Select.Option>
                ))}
              </Select>
            </div>
            <div>
              {selectedPrerequisites.map(prerequisite => (
                <Tag
                  key={prerequisite.on_kosul_kodu}
                  closable
                  onClose={() => handleRemovePrerequisite(prerequisite.on_kosul_kodu)}
                  style={{ marginBottom: 8 }}
                >
                  {prerequisite.on_kosul_kodu} - {prerequisite.ad}
                </Tag>
              ))}
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DersListesi; 