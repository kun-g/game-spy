import React, { useState, useEffect, useCallback } from 'react';
import { Table, Card, Select, Tag, Input, Button, Space, Typography } from 'antd';
import { SearchOutlined, LikeOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import api from '../services/api';

const { Option } = Select;
const { Title } = Typography;

function GamesList() {
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState('poki');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const loadGames = useCallback(async () => {
    setLoading(true);
    try {
      // 从 pagination 中提取所需的值，避免使用可变引用
      const pageSize = pagination.pageSize;
      const currentPage = pagination.current;
      
      const response = await api.getGames(
        selectedPlatform,
        pageSize,
        (currentPage - 1) * pageSize
      );
      let gamesData = response.data;
      
      // 如果有分类筛选
      if (selectedCategory) {
        gamesData = gamesData.filter(game => 
          game.categories && game.categories.includes(selectedCategory)
        );
      }
      
      // 如果有搜索文本
      if (searchText) {
        const lowerSearchText = searchText.toLowerCase();
        gamesData = gamesData.filter(game => 
          game.title.toLowerCase().includes(lowerSearchText) ||
          (game.description && game.description.toLowerCase().includes(lowerSearchText))
        );
      }
      
      setGames(gamesData);
      setPagination(prev => ({
        ...prev,
        total: gamesData.length > pageSize ? gamesData.length : pageSize * 10, // 估算总数
      }));
    } catch (error) {
      console.error("获取游戏列表失败", error);
    } finally {
      setLoading(false);
    }
  }, [selectedPlatform, selectedCategory, searchText, pagination]);

  const loadCategories = useCallback(async () => {
    try {
      const response = await api.getCategories(selectedPlatform);
      setCategories(response.data);
    } catch (error) {
      console.error("获取分类失败", error);
    }
  }, [selectedPlatform]);

  const loadPlatforms = async () => {
    try {
      const response = await api.getPlatforms();
      setPlatforms(response.data);
      if (response.data.length > 0) {
        setSelectedPlatform(response.data[0]);
      }
    } catch (error) {
      console.error('加载平台列表失败', error);
    }
  };

  useEffect(() => {
    loadPlatforms();
  }, []);

  useEffect(() => {
    if (selectedPlatform) {
      loadGames();
      loadCategories();
    }
  }, [selectedPlatform, selectedCategory, loadGames, loadCategories]);

  const handlePlatformChange = (value) => {
    setSelectedPlatform(value);
    setPagination(prev => ({ ...prev, current: 1 }));
    setSelectedCategory(null);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    loadGames();
  };

  const columns = [
    {
      title: '游戏名称',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => <Link to={`/games/${record.id}`}>{text}</Link>,
    },
    {
      title: '分类',
      dataIndex: 'categories',
      key: 'categories',
      render: (categories) => (
        <span>
          {categories && categories.slice(0, 3).map(category => (
            <Tag color="blue" key={category}>
              {category}
            </Tag>
          ))}
          {categories && categories.length > 3 && <Tag>...</Tag>}
        </span>
      ),
    },
    {
      title: '好评',
      dataIndex: 'up_count',
      key: 'up_count',
      render: (text) => (
        <span><LikeOutlined style={{ color: '#52c41a' }} /> {text}</span>
      ),
      sorter: (a, b) => a.up_count - b.up_count,
    },
    {
      title: '差评',
      dataIndex: 'down_count',
      key: 'down_count',
      render: (text) => (
        <span><LikeOutlined style={{ color: '#f5222d', transform: 'rotate(180deg)' }} /> {text}</span>
      ),
      sorter: (a, b) => a.down_count - b.down_count,
    },
    {
      title: '好评率',
      key: 'positive_ratio',
      render: (_, record) => {
        const total = record.up_count + record.down_count;
        const ratio = total > 0 ? (record.up_count / total * 100).toFixed(2) : '0.00';
        return `${ratio}%`;
      },
      sorter: (a, b) => {
        const ratioA = a.up_count / (a.up_count + a.down_count + 1);
        const ratioB = b.up_count / (b.up_count + b.down_count + 1);
        return ratioA - ratioB;
      },
    },
  ];

  return (
    <div>
      <Title level={4}>游戏列表</Title>
      
      <Space direction="horizontal" style={{ marginBottom: 16 }}>
        <Select 
          value={selectedPlatform} 
          style={{ width: 120 }} 
          onChange={handlePlatformChange}
        >
          {platforms.map(platform => (
            <Option key={platform} value={platform}>{platform.toUpperCase()}</Option>
          ))}
        </Select>
        
        <Select 
          placeholder="选择分类" 
          style={{ width: 200 }} 
          onChange={handleCategoryChange}
          value={selectedCategory}
          allowClear
        >
          {categories.map(category => (
            <Option key={category} value={category}>{category}</Option>
          ))}
        </Select>
        
        <Input 
          placeholder="搜索游戏" 
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ width: 200 }}
          onPressEnter={handleSearch}
        />
        
        <Button 
          type="primary" 
          icon={<SearchOutlined />}
          onClick={handleSearch}
        >
          搜索
        </Button>
      </Space>
      
      <Card>
        <Table 
          dataSource={games} 
          columns={columns} 
          rowKey="id"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
}

export default GamesList; 