import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Select, 
  Spin, 
  Alert, 
  Table, 
  Tag,
  Space
} from 'antd';
import { 
  PlusCircleOutlined, 
  MinusCircleOutlined
} from '@ant-design/icons';
import api from '../services/api';

const { Title } = Typography;
const { Option } = Select;

const ChangesSummary = () => {
  const [platform, setPlatform] = useState('crazygames');
  const [daysFilter, setDaysFilter] = useState(null);
  const [changesData, setChangesData] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 获取平台列表
  useEffect(() => {
    api.getPlatforms()
      .then(response => {
        setPlatforms(response.data);
      })
      .catch(err => {
        console.error('获取平台列表失败', err);
        setError('获取平台列表失败');
      });
  }, []);

  // 获取变更汇总数据并处理为表格数据
  useEffect(() => {
    setLoading(true);
    api.getChangesSummary(platform, daysFilter)
      .then(response => {
        const data = response.data;
        const tableData = [];
        
        // 处理添加的游戏URL
        data.game_urls_added.forEach(item => {
          tableData.push({
            key: `added-game-${item.name}`,
            date: getDateForUrl(data.changes_by_date, item.name, true),
            name: item.name,
            url: `https://www.${platform}.com/game/${item.name}`,
            type: 'game',
            action: 'added',
            count: item.count
          });
        });
        
        // 处理删除的游戏URL
        data.game_urls_deleted.forEach(item => {
          tableData.push({
            key: `deleted-game-${item.name}`,
            date: getDateForUrl(data.changes_by_date, item.name, false),
            name: item.name,
            url: `https://www.${platform}.com/game/${item.name}`,
            type: 'game',
            action: 'deleted',
            count: item.count
          });
        });
        
        // 处理添加的其他URL
        data.other_urls_added.forEach(item => {
          tableData.push({
            key: `added-other-${item.url}`,
            date: getDateForUrl(data.changes_by_date, item.url, true),
            name: getNameFromUrl(item.url),
            url: item.url,
            type: 'other',
            action: 'added',
            count: item.count
          });
        });
        
        // 处理删除的其他URL
        data.other_urls_deleted.forEach(item => {
          tableData.push({
            key: `deleted-other-${item.url}`,
            date: getDateForUrl(data.changes_by_date, item.url, false),
            name: getNameFromUrl(item.url),
            url: item.url,
            type: 'other',
            action: 'deleted',
            count: item.count
          });
        });
        
        setChangesData(tableData);
        setLoading(false);
      })
      .catch(err => {
        console.error('获取变更汇总数据失败', err);
        setError('获取变更汇总数据失败');
        setLoading(false);
      });
  }, [platform, daysFilter]);

  // 从URL提取名称
  const getNameFromUrl = (url) => {
    const parts = url.split('/');
    return parts[parts.length - 1] || url;
  };

  // 获取URL对应的日期（简化处理，实际上需要在原始数据中查找）
  const getDateForUrl = (dateData, urlName, isAdded) => {
    // 这里简化处理，实际应用中可能需要更复杂的逻辑来确定具体日期
    // 由于在当前数据结构中无法直接获取具体URL的修改日期，返回最近的日期作为默认值
    if (dateData && dateData.length > 0) {
      return dateData[dateData.length - 1].date;
    }
    return '';
  };

  // 表格列定义
  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => a.date.localeCompare(b.date),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <a href={record.url} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: '链接',
      dataIndex: 'url',
      key: 'url',
      render: url => (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      ),
      responsive: ['lg'],
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: type => (
        <Tag color={type === 'game' ? 'blue' : 'purple'}>
          {type === 'game' ? '游戏' : '其他'}
        </Tag>
      ),
      filters: [
        { text: '游戏', value: 'game' },
        { text: '其他', value: 'other' }
      ],
      onFilter: (value, record) => record.type === value,
    },
    {
      title: '操作',
      dataIndex: 'action',
      key: 'action',
      render: action => (
        <Tag color={action === 'added' ? 'success' : 'error'}>
          {action === 'added' ? (
            <Space>
              <PlusCircleOutlined />
              新增
            </Space>
          ) : (
            <Space>
              <MinusCircleOutlined />
              删除
            </Space>
          )}
        </Tag>
      ),
      filters: [
        { text: '新增', value: 'added' },
        { text: '删除', value: 'deleted' }
      ],
      onFilter: (value, record) => record.action === value,
    },
    {
      title: '次数',
      dataIndex: 'count',
      key: 'count',
      sorter: (a, b) => a.count - b.count,
    }
  ];

  // 处理天数筛选变化
  const handleDaysChange = (value) => {
    setDaysFilter(value === 'all' ? null : parseInt(value));
  };

  // 处理平台变化
  const handlePlatformChange = (value) => {
    setPlatform(value);
  };

  if (error) {
    return <Alert type="error" message={error} />;
  }

  return (
    <div className="changes-summary-container">
      <Card title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4}>变更汇总</Title>
          <div>
            <Select
              style={{ width: 150, marginRight: 16 }}
              placeholder="选择平台"
              value={platform}
              onChange={handlePlatformChange}
            >
              {platforms.map(p => (
                <Option key={p} value={p}>{p}</Option>
              ))}
            </Select>
            <Select
              style={{ width: 150 }}
              placeholder="过滤时间范围"
              defaultValue="all"
              onChange={handleDaysChange}
            >
              <Option value="all">全部</Option>
              <Option value="7">最近7天</Option>
              <Option value="30">最近30天</Option>
              <Option value="90">最近90天</Option>
            </Select>
          </div>
        </div>
      }>
        <Table 
          dataSource={changesData} 
          columns={columns} 
          loading={loading}
          pagination={{ pageSize: 20 }}
          size="middle"
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
};

export default ChangesSummary; 