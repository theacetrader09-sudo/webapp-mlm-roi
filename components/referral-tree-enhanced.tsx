'use client';

import { useEffect, useState, useMemo } from 'react';

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  referralCode: string;
  createdAt: string;
  level: number;
  parentReferralCode: string | null;
  totalInvestment: number;
  totalEarningsGenerated: number;
  activeInvestments: number;
  isActive: boolean;
  children?: TeamMember[];
}

interface LevelStats {
  totalUsers: number;
  totalInvestments: number;
  totalEarnings: number;
  activeUsers: number;
}

type SortField = 'name' | 'joinDate' | 'investment' | 'earnings';
type SortOrder = 'asc' | 'desc';

export default function ReferralTreeEnhanced() {
  const [tree, setTree] = useState<TeamMember[]>([]);
  const [levelStats, setLevelStats] = useState<Record<number, LevelStats>>({});
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<TeamMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('joinDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [maxDepth, setMaxDepth] = useState(10);

  useEffect(() => {
    fetchTree();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxDepth]);

  const fetchTree = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/user/referral-tree?maxLevels=${maxDepth}`);
      if (response.ok) {
        const data = await response.json();
        setTree(data.tree || []);
        setLevelStats(data.levelStatistics || {});
        // Auto-expand first level
        const firstLevelIds = data.tree?.map((m: TeamMember) => m.id) || [];
        setExpandedNodes(new Set(firstLevelIds));
      }
    } catch (error) {
      console.error('Error fetching referral tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (userId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    const allIds = new Set<string>();
    function collectIds(members: TeamMember[]) {
      for (const member of members) {
        allIds.add(member.id);
        if (member.children) {
          collectIds(member.children);
        }
      }
    }
    collectIds(tree);
    setExpandedNodes(allIds);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Flatten tree for filtering and sorting
  const flattenTree = (members: TeamMember[], level: number = 1): TeamMember[] => {
    let result: TeamMember[] = [];
    for (const member of members) {
      if (level <= maxDepth) {
        result.push(member);
        if (member.children && expandedNodes.has(member.id)) {
          result = result.concat(flattenTree(member.children, level + 1));
        }
      }
    }
    return result;
  };

  // Filter and sort
  const filteredAndSorted = useMemo(() => {
    let items = flattenTree(tree);

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name?.toLowerCase().includes(query) ||
          item.email.toLowerCase().includes(query) ||
          item.referralCode.toLowerCase().includes(query)
      );
    }

    // Filter by active status
    if (filterActive) {
      items = items.filter((item) => item.isActive);
    }

    // Filter by level
    if (selectedLevel !== 'all') {
      items = items.filter((item) => item.level === selectedLevel);
    }

    // Sort
    items.sort((a, b) => {
      let aVal: string | number, bVal: string | number;
      switch (sortField) {
        case 'name':
          aVal = (a.name || a.email).toLowerCase();
          bVal = (b.name || b.email).toLowerCase();
          break;
        case 'joinDate':
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        case 'investment':
          aVal = a.totalInvestment;
          bVal = b.totalInvestment;
          break;
        case 'earnings':
          aVal = a.totalEarningsGenerated;
          bVal = b.totalEarningsGenerated;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, searchQuery, filterActive, selectedLevel, sortField, sortOrder, expandedNodes, maxDepth]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const paginatedItems = filteredAndSorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Level',
      'Name',
      'Email',
      'Referral Code',
      'Join Date',
      'Total Investment',
      'Earnings Generated',
      'Active Investments',
      'Status',
    ];

    const rows = filteredAndSorted.map((item) => [
      item.level,
      item.name || 'N/A',
      item.email,
      item.referralCode,
      new Date(item.createdAt).toLocaleDateString(),
      item.totalInvestment.toFixed(2),
      item.totalEarningsGenerated.toFixed(2),
      item.activeInvestments,
      item.isActive ? 'Active' : 'Inactive',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `referral-tree-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderTreeItem = (member: TeamMember, depth: number = 0) => {
    const hasChildren = member.children && member.children.length > 0;
    const isExpanded = expandedNodes.has(member.id);
    const indent = depth * 24;

    return (
      <div key={member.id} className="mb-2 relative">
        <div
          className={`flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ${
            selectedUser?.id === member.id ? 'bg-purple-50 border-purple-300' : ''
          }`}
          style={{ marginLeft: `${indent}px` }}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={() => toggleExpand(member.id)}
            className={`w-6 h-6 flex items-center justify-center rounded flex-shrink-0 ${
              hasChildren
                ? 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
            disabled={!hasChildren}
          >
            {hasChildren && (
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
          </button>

          {/* User Avatar */}
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-purple-600 font-semibold text-sm">
              {(member.name || member.email)[0].toUpperCase()}
            </span>
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900 truncate">
                {member.name || 'Unknown User'}
              </p>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                member.isActive
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {member.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                Level {member.level}
              </span>
            </div>
            <p className="text-sm text-gray-700 truncate font-medium">{member.email}</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
              <span className="font-medium">Code: {member.referralCode}</span>
              <span>•</span>
              <span className="font-medium">Joined: {new Date(member.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="text-right flex-shrink-0 hidden md:block">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-700 text-xs font-semibold">Investment</p>
                <p className="font-semibold text-gray-900">
                  ${member.totalInvestment.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-700 text-xs font-semibold">Earnings</p>
                <p className="font-semibold text-green-600">
                  ${member.totalEarningsGenerated.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-gray-700 text-xs font-semibold">Active</p>
                <p className="font-semibold text-purple-600">
                  {member.activeInvestments}
                </p>
              </div>
            </div>
          </div>

          {/* View Details Button */}
          <button
            onClick={() => setSelectedUser(member)}
            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium transition-colors flex-shrink-0"
          >
            Details
          </button>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="relative">
            {member.children!.map((child) => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Name, email, or code..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Level Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <select
              value={selectedLevel}
              onChange={(e) => {
                setSelectedLevel(e.target.value === 'all' ? 'all' : parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Levels</option>
              {Object.keys(levelStats).map((level) => (
                <option key={level} value={level}>
                  Level {level}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="joinDate">Join Date</option>
              <option value="name">Name</option>
              <option value="investment">Investment</option>
              <option value="earnings">Earnings</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="filterActive"
              checked={filterActive}
              onChange={(e) => {
                setFilterActive(e.target.checked);
                setCurrentPage(1);
              }}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="filterActive" className="text-sm text-gray-700">
              Active users only
            </label>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">Max Depth:</label>
            <select
              value={maxDepth}
              onChange={(e) => {
                setMaxDepth(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
            >
              {[3, 5, 10].map((depth) => (
                <option key={depth} value={depth}>
                  {depth} Levels
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
            >
              Collapse All
            </button>
            <button
              onClick={exportToCSV}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Level Statistics */}
      {Object.keys(levelStats).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(levelStats)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([level, stats]) => (
              <div key={level} className="bg-white rounded-xl p-4 shadow-lg border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3">Level {level}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-semibold">Users:</span>
                    <span className="font-semibold text-gray-900">{stats.totalUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-semibold">Active:</span>
                    <span className="font-semibold text-green-600">{stats.activeUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-semibold">Investments:</span>
                    <span className="font-semibold text-gray-900">${stats.totalInvestments.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-semibold">Earnings:</span>
                    <span className="font-semibold text-purple-600">${stats.totalEarnings.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Tree View */}
      <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Referral Tree ({filteredAndSorted.length} users)
          </h2>
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
        </div>

        {paginatedItems.length === 0 ? (
          <div className="text-center py-12 text-gray-700 font-medium">
            <p>No users found matching your criteria.</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {paginatedItems.map((item) => {
                // Find item in tree to get depth
                function findInTree(members: TeamMember[], targetId: string, depth: number = 0): number {
                  for (const member of members) {
                    if (member.id === targetId) return depth;
                    if (member.children) {
                      const found = findInTree(member.children, targetId, depth + 1);
                      if (found !== -1) return found;
                    }
                  }
                  return -1;
                }
                const depth = findInTree(tree, item.id);
                return renderTreeItem(item, depth);
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700">Items per page:</label>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">User Details</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-700 font-semibold mb-1">Name</p>
                  <p className="font-semibold text-gray-900 text-base">{selectedUser.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-semibold mb-1">Email</p>
                  <p className="font-semibold text-gray-900 text-base">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-semibold mb-1">Referral Code</p>
                  <p className="font-semibold font-mono text-gray-900 text-base">{selectedUser.referralCode}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-semibold mb-1">Level</p>
                  <p className="font-semibold text-gray-900 text-base">Level {selectedUser.level}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-semibold mb-1">Join Date</p>
                  <p className="font-semibold text-gray-900 text-base">
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-semibold mb-1">Status</p>
                  <p className={`font-semibold text-base ${selectedUser.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedUser.isActive ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-semibold mb-1">Total Investment</p>
                  <p className="font-semibold text-lg text-gray-900">${selectedUser.totalInvestment.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-semibold mb-1">Earnings Generated</p>
                  <p className="font-semibold text-lg text-green-600">
                    ${selectedUser.totalEarningsGenerated.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-700 font-semibold mb-1">Active Investments</p>
                  <p className="font-semibold text-gray-900 text-base">{selectedUser.activeInvestments}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-700 font-semibold mb-2">Referral Link</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 px-3 py-2 rounded-lg text-sm font-mono text-gray-900 font-semibold">
                    {typeof window !== 'undefined' && `${window.location.origin}/signup?ref=${selectedUser.referralCode}`}
                  </code>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        navigator.clipboard.writeText(
                          `${window.location.origin}/signup?ref=${selectedUser.referralCode}`
                        );
                      }
                    }}
                    className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

