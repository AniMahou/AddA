import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiUserPlus, FiSearch } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import useFriendStore from '../store/friendStore';
import FriendList from '../components/friends/FriendList';
import FriendRequest from '../components/friends/FriendRequest';
import FriendSuggestions from '../components/friends/FriendSuggestions';
import SearchUsers from '../components/friends/SearchUsers';
import Button from '../components/common/Button';

const Friends = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('friends');
  const [showSearch, setShowSearch] = useState(false);
  
  const {
    friends,
    friendRequests,
    loading,
    loadFriends,
    loadFriendRequests
  } = useFriendStore();

  useEffect(() => {
    loadFriends();
    loadFriendRequests();
  }, [loadFriends, loadFriendRequests]);

  const tabs = [
    { id: 'friends', label: 'Friends', icon: FiUsers, count: friends.length },
    { id: 'requests', label: 'Requests', icon: FiUserPlus, count: friendRequests.length }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Friends</h1>
        <Button
          onClick={() => setShowSearch(true)}
          variant="primary"
          size="sm"
          icon={FiSearch}
        >
          Find Friends
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 font-medium transition-colors relative
              ${activeTab === tab.id
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600 hover:text-gray-800'
              }
            `}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-0.5">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl shadow-sm border">
        {activeTab === 'friends' && (
          <div className="p-4">
            <FriendSuggestions />
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
              </div>
            ) : (
              <FriendList friends={friends} />
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="p-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
              </div>
            ) : friendRequests.length > 0 ? (
              <div className="divide-y">
                {friendRequests.map((request) => (
                  <FriendRequest
                    key={request._id}
                    request={request}
                    onAccept={() => {
                      loadFriends();
                      loadFriendRequests();
                    }}
                    onReject={loadFriendRequests}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">No pending friend requests</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search modal */}
      {showSearch && <SearchUsers onClose={() => setShowSearch(false)} />}
    </div>
  );
};

export default Friends;