'use client';

import { useState, useEffect } from 'react';
import companiesData from '@/data/companies.json';

type TabType = 'overview' | 'upstream' | 'midstream' | 'downstream';

interface Company {
  id: string;
  name: string;
  nameEn: string;
  role: string;
  position: string;
  customers?: string[];
  highlights: string[];
  location: string;
  isKey?: boolean;
}

interface SupplyChainSection {
  name: string;
  description: string;
  companies: Company[];
}

const sectionKeys: { key: TabType; label: string; subkey: 'upstream' | 'midstream' | 'downstream' | null }[] = [
  { key: 'overview', label: '全产业链总览', subkey: null },
  { key: 'upstream', label: '上游：材料与元器件', subkey: 'upstream' },
  { key: 'midstream', label: '中游：设计与制造', subkey: 'midstream' },
  { key: 'downstream', label: '下游：运营商与集成商', subkey: 'downstream' },
];

export default function CompaniesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedSection, setSelectedSection] = useState<{ key: string; company: Company } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const supplyChain = companiesData.supplyChain;

  const renderStars = (isKey?: boolean) => {
    if (!isKey) return null;
    return <span className="ml-2 text-yellow-400">⭐</span>;
  };

  const openDetail = (company: Company) => {
    setSelectedCompany(company);
  };

  const closeDetail = () => {
    setSelectedCompany(null);
  };

  const renderCompanyCard = (company: Company, sectionKey: string) => (
    <div
      key={company.id}
      className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
      onClick={() => openDetail(company)}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-800 text-sm leading-tight">
          {company.name}
          {renderStars(company.isKey)}
        </h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded ml-2 shrink-0">{company.location}</span>
      </div>
      <p className="text-xs text-blue-600 mb-2">{company.role}</p>
      <p className="text-xs text-gray-600 leading-relaxed">{company.position}</p>
      {company.highlights.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {company.highlights.slice(0, 3).map((tag, i) => (
            <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* 总览说明 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
        <p className="text-sm text-gray-700 leading-relaxed">{companiesData.summary}</p>
      </div>

      {/* 上游 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
          <h2 className="text-base font-semibold text-gray-800">上游：材料与元器件</h2>
        </div>
        <p className="text-xs text-gray-500 mb-3">{supplyChain.upstream.description}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {supplyChain.upstream.companies.map(c => renderCompanyCard(c, 'upstream'))}
        </div>
      </div>

      {/* 中游 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          <h2 className="text-base font-semibold text-gray-800">中游：设计与制造</h2>
        </div>
        <p className="text-xs text-gray-500 mb-3">{supplyChain.midstream.description}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {supplyChain.midstream.companies.map(c => renderCompanyCard(c, 'midstream'))}
        </div>
      </div>

      {/* 下游 */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          <h2 className="text-base font-semibold text-gray-800">下游：运营商与集成商</h2>
        </div>
        <p className="text-xs text-gray-500 mb-3">{supplyChain.downstream.description}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {supplyChain.downstream.companies.map(c => renderCompanyCard(c, 'downstream'))}
        </div>
      </div>
    </div>
  );

  const renderSection = (subkey: 'upstream' | 'midstream' | 'downstream') => {
    const section = supplyChain[subkey] as SupplyChainSection;
    return (
      <div>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 mb-5">
          <p className="text-sm text-gray-700 leading-relaxed">{section.description}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {section.companies.map(c => renderCompanyCard(c, subkey))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* 顶部标题 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 mb-4">企业图谱</h1>
          {/* Tab切换 */}
          <div className="flex gap-1 overflow-x-auto">
            {sectionKeys.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'upstream' && renderSection('upstream')}
        {activeTab === 'midstream' && renderSection('midstream')}
        {activeTab === 'downstream' && renderSection('downstream')}
      </div>

      {/* 详情弹窗 */}
      {selectedCompany && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeDetail}>
          <div className="bg-white rounded-xl max-w-lg w-full max-h-screen overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedCompany.name}</h2>
                  <p className="text-sm text-gray-500">{selectedCompany.nameEn}</p>
                </div>
                <button onClick={closeDetail} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
              </div>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">角色定位</p>
                  <p className="text-sm text-gray-800 font-medium">{selectedCompany.role}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">企业简介</p>
                  <p className="text-sm text-gray-800">{selectedCompany.position}</p>
                </div>
                {selectedCompany.customers && selectedCompany.customers.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">主要客户</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedCompany.customers.map((c, i) => (
                        <span key={i} className="text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{c}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">业务亮点</p>
                  <ul className="space-y-1 mt-1">
                    {selectedCompany.highlights.map((h, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-1">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">所在地</p>
                  <p className="text-sm text-gray-800">{selectedCompany.location}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}