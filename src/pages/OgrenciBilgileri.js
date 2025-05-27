import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Modal,
  Form,
  Input,
  Table,
  message,
  Space
} from 'antd';

const { Text } = Typography;

const OgrenciBilgileri = () => {
  const [ogrenciBilgileri, setOgrenciBilgileri] = useState(null);
  const [notBilgileri, setNotBilgileri] = useState(null);
  const [veliModalVisible, setVeliModalVisible] = useState(false);
  const [sifreModalVisible, setSifreModalVisible] = useState(false);
  const [yeniVeli, setYeniVeli] = useState({
    ad: '',
    soyad: '',
    telefon: '',
    e_posta: ''
  });
  const [sifreDegistir, setSifreDegistir] = useState({
    eski_sifre: '',
    yeni_sifre: '',
    yeni_sifre_tekrar: ''
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    if (userData?.kullanici_adi) {
      fetchOgrenciBilgileri(userData.kullanici_adi);
      fetchNotBilgileri(userData.kullanici_adi);
    } else {
      message.error('Kullanıcı bilgisi bulunamadı');
    }
  }, []);

  const fetchOgrenciBilgileri = async (kullanici_adi) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/ogrenci/bilgiler/${kullanici_adi}`);
      setOgrenciBilgileri(response.data);
    } catch (error) {
      message.error('Öğrenci bilgileri alınırken hata oluştu');
    }
  };

  const fetchNotBilgileri = async (kullanici_adi) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/ogrenci/not-ortalamasi/${kullanici_adi}`);
      setNotBilgileri(response.data);
    } catch (error) {
      message.error('Not bilgileri alınırken hata oluştu');
    }
  };

  const handleVeliEkle = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const ogrenci_no = userData.kullanici_adi.split('@')[0];
      await axios.post('http://localhost:5000/api/ogrenci/veli-ekle', {
        ogrenci_no,
        ...yeniVeli
      });
      setVeliModalVisible(false);
      setYeniVeli({ ad: '', soyad: '', telefon: '', e_posta: '' });
      fetchOgrenciBilgileri(userData.kullanici_adi);
      message.success('Veli başarıyla eklendi');
    } catch (error) {
      message.error('Veli eklenirken hata oluştu');
    }
  };

  const handleVeliSil = async (veli_id) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const ogrenci_no = userData.kullanici_adi.split('@')[0];
      await axios.delete(`http://localhost:5000/api/ogrenci/veli-sil/${ogrenci_no}/${veli_id}`);
      fetchOgrenciBilgileri(userData.kullanici_adi);
      message.success('Veli başarıyla silindi');
    } catch (error) {
      message.error('Veli silinirken hata oluştu');
    }
  };

  const handleSifreDegistir = async () => {
    if (sifreDegistir.yeni_sifre !== sifreDegistir.yeni_sifre_tekrar) {
      message.error('Yeni şifreler eşleşmiyor');
      return;
    }

    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      await axios.put('http://localhost:5000/api/kullanici/sifre-degistir', {
        mevcut_sifre: sifreDegistir.eski_sifre,
        yeni_sifre: sifreDegistir.yeni_sifre,
        user: userData
      });
      setSifreModalVisible(false);
      setSifreDegistir({ eski_sifre: '', yeni_sifre: '', yeni_sifre_tekrar: '' });
      message.success('Şifre başarıyla değiştirildi');
    } catch (error) {
      message.error(error.response?.data?.message || 'Şifre değiştirilirken hata oluştu');
    }
  };

  if (!ogrenciBilgileri || !notBilgileri) {
    return <Text>Yükleniyor...</Text>;
  }

  const notColumns = [
    {
      title: 'Ders Kodu',
      dataIndex: 'ders_kodu',
      key: 'ders_kodu',
    },
    {
      title: 'Ders Adı',
      dataIndex: 'ders_adi',
      key: 'ders_adi',
    },
    {
      title: 'Kredi',
      dataIndex: 'kredi',
      key: 'kredi',
    },
    {
      title: 'Not',
      dataIndex: 'notu',
      key: 'notu',
    },
    {
      title: 'Dönem',
      dataIndex: 'donem',
      key: 'donem',
      render: (_, record) => `${record.yil} ${record.donem}`,
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="Öğrenci Bilgileri">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text><strong>Öğrenci No:</strong> {ogrenciBilgileri.ogrenci_no}</Text>
              <Text><strong>Ad Soyad:</strong> {ogrenciBilgileri.ad} {ogrenciBilgileri.soyad}</Text>
              <Text><strong>Bölüm:</strong> {ogrenciBilgileri.bolum_adi}</Text>
              <Text><strong>E-posta:</strong> {ogrenciBilgileri.e_posta}</Text>
              <Text><strong>Telefon:</strong> {ogrenciBilgileri.telefon}</Text>
              <Text><strong>Sınıf:</strong> {ogrenciBilgileri.sinif}</Text>
              <Text><strong>Durum:</strong> {ogrenciBilgileri.statu}</Text>
              {ogrenciBilgileri.danisman_ad && (
                <Text>
                  <strong>Danışman:</strong> {ogrenciBilgileri.danisman_unvan} {ogrenciBilgileri.danisman_ad} {ogrenciBilgileri.danisman_soyad}
                </Text>
              )}
              <Button type="primary" onClick={() => setSifreModalVisible(true)}>
                Şifre Değiştir
              </Button>
            </Space>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Not Bilgileri">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text strong>GANO: {notBilgileri.gano}</Text>
              <Text>Toplam Kredi: {notBilgileri.toplamKredi}</Text>
              <Table
                columns={notColumns}
                dataSource={notBilgileri.dersler}
                rowKey={(record) => `${record.ders_kodu}-${record.yil}-${record.donem}`}
                size="small"
                pagination={false}
              />
            </Space>
          </Card>
        </Col>

        <Col span={24}>
          <Card title="Veli Bilgileri">
            {ogrenciBilgileri.veli_id ? (
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Text><strong>Ad Soyad:</strong> {ogrenciBilgileri.veli_ad} {ogrenciBilgileri.veli_soyad}</Text>
                </Col>
                <Col span={6}>
                  <Text><strong>Telefon:</strong> {ogrenciBilgileri.veli_telefon}</Text>
                </Col>
                <Col span={6}>
                  <Text><strong>E-posta:</strong> {ogrenciBilgileri.veli_e_posta}</Text>
                </Col>
                <Col span={6}>
                  <Button type="primary" danger onClick={() => handleVeliSil(ogrenciBilgileri.veli_id)}>
                    Veli Sil
                  </Button>
                </Col>
              </Row>
            ) : (
              <Button type="primary" onClick={() => setVeliModalVisible(true)}>
                Veli Ekle
              </Button>
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title="Veli Ekle"
        open={veliModalVisible}
        onOk={handleVeliEkle}
        onCancel={() => setVeliModalVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item label="Ad">
            <Input
              value={yeniVeli.ad}
              onChange={(e) => setYeniVeli({ ...yeniVeli, ad: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="Soyad">
            <Input
              value={yeniVeli.soyad}
              onChange={(e) => setYeniVeli({ ...yeniVeli, soyad: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="Telefon">
            <Input
              value={yeniVeli.telefon}
              onChange={(e) => setYeniVeli({ ...yeniVeli, telefon: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="E-posta">
            <Input
              value={yeniVeli.e_posta}
              onChange={(e) => setYeniVeli({ ...yeniVeli, e_posta: e.target.value })}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Şifre Değiştir"
        open={sifreModalVisible}
        onOk={handleSifreDegistir}
        onCancel={() => setSifreModalVisible(false)}
      >
        <Form layout="vertical">
          <Form.Item label="Eski Şifre">
            <Input.Password
              value={sifreDegistir.eski_sifre}
              onChange={(e) => setSifreDegistir({ ...sifreDegistir, eski_sifre: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="Yeni Şifre">
            <Input.Password
              value={sifreDegistir.yeni_sifre}
              onChange={(e) => setSifreDegistir({ ...sifreDegistir, yeni_sifre: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="Yeni Şifre (Tekrar)">
            <Input.Password
              value={sifreDegistir.yeni_sifre_tekrar}
              onChange={(e) => setSifreDegistir({ ...sifreDegistir, yeni_sifre_tekrar: e.target.value })}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OgrenciBilgileri; 