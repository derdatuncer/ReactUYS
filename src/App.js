import React, { useState, useEffect } from 'react';
import Login from './Login';
import { Layout, Menu, Card, Row, Col, Statistic, Button, message, Table, Tag, Space } from 'antd';
import { 
  UserOutlined, BookOutlined, TeamOutlined, SettingOutlined,
  SolutionOutlined, ReadOutlined, BankOutlined, CheckCircleOutlined,
  CalendarOutlined, FileAddOutlined, ScheduleOutlined, 
  AppstoreAddOutlined, UserAddOutlined, PlusOutlined,
  FormOutlined, DashboardOutlined, MenuUnfoldOutlined, MenuFoldOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes, useNavigate, Navigate } from 'react-router-dom';
import OgrenciEkle from './pages/OgrenciEkle';
import OgrenciListesi from './pages/OgrenciListesi';
import OgretimUyesiListesi from './pages/OgretimUyesiListesi';
import OgretimUyesiEkle from './pages/OgretimUyesiEkle';
import DersEkle from './pages/DersEkle';
import DersListesi from './pages/DersListesi';
import BolumEkle from './pages/BolumEkle';
import BolumListesi from './pages/BolumListesi';
import DersProgrami from './pages/DersProgrami';
import Ayarlar from './pages/Ayarlar';
import Derslerim from './pages/Derslerim';
import OgrenciDersProgrami from './pages/OgrenciDersProgrami';
import DersSecme from './pages/DersSecme';
import OgrenciBilgileri from './pages/OgrenciBilgileri';
import AkademiDerslerim from './pages/AkademiDerslerim';
import AkademiDersProgrami from './pages/AkademiDersProgrami';
import AkademiDanismanlik from './pages/AkademiDanismanlik';
import AkademiBilgileri from './pages/AkademiBilgileri';

const { Header, Content, Sider } = Layout;

const StudentLayout = () => {
  const [selectedKey, setSelectedKey] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.reload();
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData || !userData.kullanici_adi) {
          message.error('Kullanıcı bilgisi bulunamadı');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/student/dashboard', {
          headers: {
            'x-user': userData.kullanici_adi
          }
        });
        setStats(response.data);
      } catch (error) {
        message.error('İstatistikler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'derslerim',
      icon: <BookOutlined />,
      label: 'Derslerim',
    },
    {
      key: 'ders-programi',
      icon: <ScheduleOutlined />,
      label: 'Ders Programı',
    },
    {
      key: 'ders-secme',
      icon: <FileAddOutlined />,
      label: 'Ders Seçme',
    },
    {
      key: 'bilgilerim',
      icon: <UserOutlined />,
      label: 'Bilgilerim',
    }
  ];

  const DashboardContent = () => (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Toplam Ders"
              value={stats?.toplamDers}
              prefix={<BookOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Başarılı Dersler"
              value={stats?.basariliDersler}
              prefix={<CheckCircleOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Toplam Kredi"
              value={stats?.toplamKredi}
              prefix={<ReadOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderContent = () => {
    switch (selectedKey) {
      case 'dashboard':
        return <DashboardContent />;
      case 'derslerim':
        return <Derslerim />;
      case 'ders-programi':
        return <OgrenciDersProgrami />;
      case 'ders-secme':
        return <DersSecme />;
      case 'bilgilerim':
        return <OgrenciBilgileri />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#001529' }}>
        <span style={{ color: '#fff', fontSize: '18px' }}>Öğrenci Paneli</span>
        <div>
          <span style={{ color: '#fff', marginRight: '16px' }}>
            Hoş Geldiniz, {JSON.parse(localStorage.getItem('user'))?.kullanici_adi?.split('@')[0]}
          </span>
          <Button type="primary" danger onClick={handleLogout}>
            Çıkış Yap
          </Button>
        </div>
      </Header>
      <Layout>
        <Sider 
          width={250} 
          style={{ background: '#fff' }}
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          trigger={null}
        >
          <div style={{ 
            padding: '16px', 
            textAlign: 'center', 
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ 
              fontSize: '16px', 
              fontWeight: 'bold',
              opacity: collapsed ? 0 : 1,
              transition: 'opacity 0.2s'
            }}>
              {collapsed ? '' : 'Menü'}
            </span>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px' }}
            />
          </div>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={({ key }) => setSelectedKey(key)}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content style={{ background: '#fff', padding: 24, margin: 0, minHeight: 280 }}>
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

const AdminLayout = () => {
  const [selectedKey, setSelectedKey] = useState('1');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.reload();
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/admin/dashboard');
        setStats(response.data);
      } catch (error) {
        console.error('İstatistikler yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'ogrenci',
      icon: <TeamOutlined />,
      label: 'Öğrenci İşlemleri',
      children: [
        {
          key: 'ogrenci-ekle',
          icon: <UserAddOutlined />,
          label: 'Öğrenci Ekle',
        },
        {
          key: 'ogrenci-liste',
          icon: <FormOutlined />,
          label: 'Öğrenci Listesi',
        },
      ]
    },
    {
      key: 'ogretim-uyesi',
      icon: <UserOutlined />,
      label: 'Öğretim Üyesi İşlemleri',
      children: [
        {
          key: 'ogretim-uyesi-ekle',
          icon: <UserAddOutlined />,
          label: 'Öğretim Üyesi Ekle',
        },
        {
          key: 'ogretim-uyesi-liste',
          icon: <FormOutlined />,
          label: 'Öğretim Üyesi Listesi',
        }
      ]
    },
    {
      key: 'ders',
      icon: <BookOutlined />,
      label: 'Ders İşlemleri',
      children: [
        {
          key: 'ders-ekle',
          icon: <FileAddOutlined />,
          label: 'Ders Ekle',
        },
        {
          key: 'ders-liste',
          icon: <ReadOutlined />,
          label: 'Ders Listesi',
        },
      ]
    },
    {
      key: 'bolum',
      icon: <BankOutlined />,
      label: 'Bölüm İşlemleri',
      children: [
        {
          key: 'bolum-ekle',
          icon: <AppstoreAddOutlined />,
          label: 'Bölüm Ekle',
        },
        {
          key: 'bolum-liste',
          icon: <FormOutlined />,
          label: 'Bölüm Listesi',
        }
      ]
    },
    {
      key: 'ders-programi',
      icon: <CalendarOutlined />,
      label: 'Ders Programı',
    },
    {
      key: 'ayarlar',
      icon: <SettingOutlined />,
      label: 'Ayarlar',
    }
  ];

  const DashboardContent = () => (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Toplam Öğrenci"
              value={stats?.ogrenciSayisi}
              prefix={<SolutionOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Aktif Öğrenci"
              value={stats?.aktifOgrenciSayisi}
              prefix={<CheckCircleOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Öğretim Üyesi"
              value={stats?.ogretimUyesiSayisi}
              prefix={<TeamOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Bölüm Sayısı"
              value={stats?.bolumSayisi}
              prefix={<BankOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Toplam Ders"
              value={stats?.dersSayisi}
              prefix={<ReadOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderContent = () => {
    switch (selectedKey) {
      case 'dashboard':
        return <DashboardContent />;
      case 'ogrenci-liste':
        return <OgrenciListesi />;
      case 'ogretim-uyesi-liste':
        return <OgretimUyesiListesi />;
      case 'ogrenci-ekle':
        return <OgrenciEkle />;
      case 'ogretim-uyesi-ekle':
        return <OgretimUyesiEkle />;
      case 'ders-ekle':
        return <DersEkle />;
      case 'ders-liste':
        return <DersListesi />;
      case 'bolum-ekle':
        return <BolumEkle />;
      case 'bolum-liste':
        return <BolumListesi />;
      case 'ders-programi':
        return <DersProgrami />;
      case 'ayarlar':
        return <Ayarlar />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#001529' }}>
        <span style={{ color: '#fff', fontSize: '18px' }}>Admin Paneli</span>
        <div>
          <span style={{ color: '#fff', marginRight: '16px' }}>Hoş Geldiniz, Admin</span>
          <Button type="primary" danger onClick={handleLogout}>
            Çıkış Yap
          </Button>
        </div>
      </Header>
      <Layout>
        <Sider 
          width={250} 
          style={{ background: '#fff' }}
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          trigger={null}
        >
          <div style={{ 
            padding: '16px', 
            textAlign: 'center', 
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ 
              fontSize: '16px', 
              fontWeight: 'bold',
              opacity: collapsed ? 0 : 1,
              transition: 'opacity 0.2s'
            }}>
              {collapsed ? '' : 'Menü'}
            </span>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px' }}
            />
          </div>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ height: '100%', borderRight: 0 }}
            items={menuItems}
            onClick={({ key }) => setSelectedKey(key)}
          />
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content style={{ background: '#fff', padding: 24, margin: 0, minHeight: 280 }}>
            {renderContent()}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

const AcademicLayout = () => {
  const [selectedKey, setSelectedKey] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.reload();
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData || !userData.kullanici_adi) {
          message.error('Kullanıcı bilgisi bulunamadı');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/academic/dashboard', {
          headers: {
            'x-user': userData.kullanici_adi
          }
        });
        setStats(response.data);
      } catch (error) {
        message.error('İstatistikler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'derslerim',
      icon: <BookOutlined />,
      label: 'Derslerim',
    },
    {
      key: 'ders-programi',
      icon: <ScheduleOutlined />,
      label: 'Ders Programı',
    },
    {
      key: 'danismanlik',
      icon: <TeamOutlined />,
      label: 'Danışmanlık',
    },
    {
      key: 'bilgilerim',
      icon: <UserOutlined />,
      label: 'Bilgilerim',
    }
  ];

  const DashboardContent = () => (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Verdiğim Dersler"
              value={stats?.verilenDersSayisi}
              prefix={<BookOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Danışman Olduğum Öğrenciler"
              value={stats?.danismanOgrenciSayisi}
              prefix={<TeamOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Aktif Dönem"
              value={stats?.aktifDonem}
              prefix={<CalendarOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Bölüm"
              value={stats?.bolumAdi}
              prefix={<BankOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Unvan"
              value={stats?.unvan}
              prefix={<UserOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderContent = () => {
    switch (selectedKey) {
      case 'dashboard':
        return <DashboardContent />;
      case 'derslerim':
        return <AkademiDerslerim />;
      case 'ders-programi':
        return <AkademiDersProgrami />;
      case 'danismanlik':
        return <AkademiDanismanlik />;
      case 'bilgilerim':
        return <AkademiBilgileri />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#001529' }}>
        <span style={{ color: '#fff', fontSize: '18px' }}>Akademik Panel</span>
        <div>
          <span style={{ color: '#fff', marginRight: '16px' }}>
            Hoş Geldiniz, {JSON.parse(localStorage.getItem('user'))?.kullanici_adi?.split('@')[0]}
          </span>
          <Button type="primary" danger onClick={handleLogout}>
            Çıkış Yap
          </Button>
        </div>
      </Header>
      <Layout>
        <Sider 
          width={250} 
          style={{ background: '#fff' }}
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
          trigger={null}
        >
          <div style={{ 
            padding: '16px', 
            textAlign: 'center', 
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ 
              fontSize: '16px', 
              fontWeight: 'bold',
              opacity: collapsed ? 0 : 1,
              transition: 'opacity 0.2s'
            }}>
              {collapsed ? '' : 'Menü'}
            </span>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ marginLeft: '8px' }}
            />
          </div>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            items={menuItems}
            onClick={({ key }) => setSelectedKey(key)}
          />
        </Sider>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280 }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

const AppContent = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Sayfa yüklendiğinde localStorage'dan kullanıcı bilgilerini kontrol et
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserData(user);
      setIsAuthenticated(true);
      
      // Axios için varsayılan header'ı ayarla
      axios.defaults.headers.common['x-user'] = user.kullanici_adi;
      
      // Rol bazlı yönlendirme
      switch (user.rol) {
        case 'ogrenci':
          navigate('/ogrenci');
          break;
        case 'ogretim_gorevlisi':
          navigate('/akademi');
          break;
        case 'yonetici':
          navigate('/admin');
          break;
        default:
          navigate('/');
      }
    }
  }, [navigate]);

  const handleLogin = (username) => {
    setIsAuthenticated(true);
    const user = JSON.parse(localStorage.getItem('user'));
    setUserData(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUserData(null);
    delete axios.defaults.headers.common['x-user'];
    navigate('/');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Routes>
      {userData.rol === 'ogrenci' && <Route path="/*" element={<StudentLayout />} />}
      {userData.rol === 'ogretim_gorevlisi' && <Route path="/*" element={<AcademicLayout />} />}
      {userData.rol === 'yonetici' && <Route path="/*" element={<AdminLayout />} />}
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
