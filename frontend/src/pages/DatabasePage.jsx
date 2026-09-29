import { useEffect, useState, useCallback } from 'react';
import { Database, Table, Layers, RefreshCw, Search, Hash, Type, Key, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { getSchema } from '../lib/api';

const TABLE_DESCRIPTIONS = {
  customers: 'Customer accounts, personal names, emails, and registration dates.',
  orders: 'Sales orders placed by customers, tracking order dates, status, and total purchase amounts.',
  order_items: 'Line-item breakdown of products, unit prices, and quantities for each order.',
  products: 'Inventory catalog featuring product titles, pricing, and stock levels.',
};

export default function DatabasePage() {
  const [schema, setSchema] = useState(null);
  const [schemaStatus, setSchemaStatus] = useState('loading'); // 'loading'|'unavailable'|'ready'
  const [activeTab, setActiveTab] = useState('data'); // 'data' | 'schema'
  const [selectedTableName, setSelectedTableName] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const fetchSchema = useCallback(async () => {
    setSchemaStatus('loading');
    try {
      const data = await getSchema();
      const tables = data.tables || [];
      setSchema(tables);
      if (tables.length > 0 && !selectedTableName) {
        setSelectedTableName(tables[0].name);
      }
      setSchemaStatus('ready');
    } catch {
      setSchemaStatus('unavailable');
      setSchema(null);
    }
  }, [selectedTableName]);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  const selectedTable = schema?.find((t) => t.name === selectedTableName) || schema?.[0];

  const filteredData = (selectedTable?.data || []).filter((row) => {
    if (!searchFilter.trim()) return true;
    const term = searchFilter.toLowerCase();
    return Object.values(row).some((val) =>
      val !== null && String(val).toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <h3 className="font-display font-bold text-2xl text-white tracking-tight flex items-center gap-2.5">
            <Database className="text-[#76C457]" size={22} />
            Sandbox Database Explorer
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Separated into <span className="hl-green">Live Table Records</span> and <span className="hl-neutral">Data Model Schema</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tabs */}
          <div className="flex p-1 bg-[#12141a] border border-white/[0.08] rounded-xl">
            <button
              onClick={() => setActiveTab('data')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'data'
                  ? 'bg-[#76C457] text-black shadow-[0_0_12px_rgba(118,196,87,0.35)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Table size={14} />
              <span>Browse Live Data</span>
            </button>
            <button
              onClick={() => setActiveTab('schema')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'schema'
                  ? 'bg-[#76C457] text-black shadow-[0_0_12px_rgba(118,196,87,0.35)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers size={14} />
              <span>Schema & Architecture</span>
            </button>
          </div>

          <button
            onClick={fetchSchema}
            disabled={schemaStatus === 'loading'}
            className="p-2.5 rounded-xl border border-white/[0.08] hover:border-white/20 bg-[#12141a] text-gray-300 hover:text-white transition-colors"
            title="Refresh database records"
          >
            <RefreshCw size={14} className={schemaStatus === 'loading' ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {schemaStatus === 'loading' && (
        <div className="p-12 text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#76C457] border-t-transparent" />
          <p className="text-sm text-gray-400 font-medium">Connecting to sandbox database…</p>
        </div>
      )}

      {/* Unavailable */}
      {schemaStatus === 'unavailable' && (
        <div className="p-8 rounded-2xl border border-orange-500/20 bg-orange-500/5 text-center space-y-2">
          <AlertCircle className="mx-auto text-orange-400" size={28} />
          <h4 className="text-base font-semibold text-white">Database schema unavailable</h4>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            Unable to connect to the backend SQLite sandbox. Ensure your local server is running on port 8000.
          </p>
        </div>
      )}

      {/* Content */}
      {schemaStatus === 'ready' && schema && (
        <>
          {/* TAB 1: BROWSE LIVE DATA */}
          {activeTab === 'data' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Table Selection Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 mr-2">
                  Select Table:
                </span>
                {schema.map((tbl) => {
                  const isSelected = selectedTableName === tbl.name;
                  return (
                    <button
                      key={tbl.name}
                      onClick={() => {
                        setSelectedTableName(tbl.name);
                        setSearchFilter('');
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold font-mono transition-all flex items-center gap-2 ${
                        isSelected
                          ? 'bg-white text-black font-bold shadow-[0_0_14px_rgba(255,255,255,0.25)] ring-2 ring-[#76C457]'
                          : 'bg-[#12141a] text-gray-300 border border-white/[0.08] hover:border-white/20 hover:text-white'
                      }`}
                    >
                      <Table size={13} className={isSelected ? 'text-black' : 'text-[#76C457]'} />
                      <span>{tbl.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-black/10 text-black' : 'bg-white/10 text-gray-400'}`}>
                        {tbl.data?.length || 0}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Table Info & Search Banner */}
              {selectedTable && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0f1117] border border-white/[0.07]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-white">{selectedTable.name}</span>
                      <span className="hl-green text-xs">
                        {selectedTable.columns.length} columns
                      </span>
                      <span className="text-xs text-gray-400">
                        • {selectedTable.data?.length || 0} total records
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {TABLE_DESCRIPTIONS[selectedTable.name] || 'Active SQLite sandbox table.'}
                    </p>
                  </div>

                  {/* Search records */}
                  <div className="relative min-w-[240px]">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder={`Filter in ${selectedTable.name}…`}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-black/60 border border-white/[0.1] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#76C457] transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Data Table */}
              {selectedTable && (
                <div className="rounded-2xl border border-white/[0.08] bg-[#0c0d12] overflow-hidden shadow-2xl">
                  <div className="overflow-x-auto scrollbar-x max-h-[460px]">
                    <table className="min-w-full text-xs text-left divide-y divide-white/[0.06]">
                      <thead className="bg-[#12141a] text-gray-300 font-mono sticky top-0 z-10">
                        <tr>
                          {selectedTable.columns.map((col) => (
                            <th
                              key={col.name}
                              className="px-5 py-3.5 font-semibold tracking-wider whitespace-nowrap"
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-white">{col.name}</span>
                                <span className="text-[10px] px-1 py-0.2 rounded bg-white/[0.06] text-gray-400 font-normal">
                                  {col.type || 'TEXT'}
                                </span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04] font-mono">
                        {filteredData.length === 0 ? (
                          <tr>
                            <td
                              colSpan={selectedTable.columns.length}
                              className="px-6 py-12 text-center text-gray-500"
                            >
                              No records match &quot;{searchFilter}&quot;
                            </td>
                          </tr>
                        ) : (
                          filteredData.map((row, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-white/[0.03] transition-colors"
                            >
                              {selectedTable.columns.map((col) => {
                                const val = row[col.name];
                                const isId = col.name.toLowerCase().endsWith('id');
                                const isStatus = col.name.toLowerCase() === 'status';

                                return (
                                  <td
                                    key={col.name}
                                    className="px-5 py-3 whitespace-nowrap text-gray-300"
                                  >
                                    {val === null ? (
                                      <span className="text-gray-600 italic">null</span>
                                    ) : isId ? (
                                      <span className="hl-neutral font-semibold text-[11px]">
                                        #{val}
                                      </span>
                                    ) : isStatus ? (
                                      <span
                                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                          String(val).toLowerCase() === 'delivered' ||
                                          String(val).toLowerCase() === 'active' ||
                                          String(val).toLowerCase() === 'completed'
                                            ? 'hl-green'
                                            : 'hl-orange'
                                        }`}
                                      >
                                        {String(val)}
                                      </span>
                                    ) : (
                                      <span>{String(val)}</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-5 py-3 bg-[#12141a]/60 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-gray-400 font-mono">
                    <span>
                      Showing {filteredData.length} of {selectedTable.data?.length || 0} rows
                    </span>
                    <span className="text-gray-500">SQLite Sandbox Isolation</span>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 2: SCHEMA ARCHITECTURE & DATA DICTIONARY */}
          {activeTab === 'schema' && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-gray-400">
                <span className="hl-green font-semibold">Schema Architecture</span> defines the exact structure and relational keys used by the SQL agent. The agent strictly reads this schema and cannot hallucinate foreign tables or delete columns.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {schema.map((tbl) => (
                  <div
                    key={tbl.name}
                    className="rounded-2xl border border-white/[0.08] bg-[#0c0d12] p-5 shadow-xl space-y-4 hover:border-white/20 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Table size={16} className="text-[#76C457]" />
                          <h4 className="font-mono font-bold text-lg text-white">
                            {tbl.name}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-400">
                          {TABLE_DESCRIPTIONS[tbl.name] || 'Application data table.'}
                        </p>
                      </div>
                      <span className="hl-neutral text-[11px] font-mono">
                        {tbl.columns.length} columns
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                      {tbl.columns.map((col) => {
                        const isPrimaryKey = col.name.toLowerCase() === 'id';
                        const isForeignKey = col.name.toLowerCase().endsWith('_id');
                        const type = (col.type || 'TEXT').toUpperCase();

                        return (
                          <div
                            key={col.name}
                            className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-[#12141a] text-xs font-mono group hover:bg-[#181a22] transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {isPrimaryKey ? (
                                <Key size={12} className="text-[#76C457]" />
                              ) : isForeignKey ? (
                                <Hash size={12} className="text-orange-400" />
                              ) : type.includes('INT') || type.includes('REAL') ? (
                                <Hash size={12} className="text-gray-400" />
                              ) : (
                                <Type size={12} className="text-gray-400" />
                              )}
                              <span className="text-white font-medium">{col.name}</span>
                              {isPrimaryKey && (
                                <span className="hl-green text-[9px] px-1 py-0.2 rounded font-bold uppercase">
                                  PK
                                </span>
                              )}
                              {isForeignKey && (
                                <span className="hl-orange text-[9px] px-1 py-0.2 rounded font-bold uppercase">
                                  FK
                                </span>
                              )}
                            </div>

                            <span className="text-[11px] text-gray-400 font-semibold">
                              {type}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
