import React from 'react';  // Add this
import { FiCheck, FiX } from 'react-icons/fi';
import useFriendStore from '../../store/friendStore';
import Button from '../common/Button';
import { formatMessageTime } from '../../utils/helpers';

const FriendRequest = ({ request, onAccept, onReject }) => {
  const { acceptRequest, rejectRequest } = useFriendStore();

  const handleAccept = async () => {
    try {
      await acceptRequest(request._id);
      onAccept?.(request);
    } catch (error) {
      // Error handled in store
    }
  };

  const handleReject = async () => {
    try {
      await rejectRequest(request._id);
      onReject?.(request);
    } catch (error) {
      // Error handled in store
    }
  };

  const getAvatarUrl = (name) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b last:border-b-0">
      <div className="flex items-center gap-3">
        <img
          src={request.from?.profilePic || getAvatarUrl(request.from?.name || 'User')}
          alt={request.from?.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <h3 className="font-medium text-gray-800">{request.from?.name}</h3>
          <p className="text-sm text-gray-500">{request.from?.email}</p>
          {request.message && (
            <p className="text-sm text-gray-600 mt-1 italic">
              "{request.message}"
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {formatMessageTime(request.createdAt)}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleAccept}
          className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
          title="Accept"
        >
          <FiCheck className="w-5 h-5" />
        </button>
        <button
          onClick={handleReject}
          className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
          title="Reject"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};  

export default FriendRequest;