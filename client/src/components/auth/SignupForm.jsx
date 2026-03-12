import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import { validateSignupForm } from '../../utils/validators';
import { TOAST_MESSAGES } from '../../utils/constants';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiUserPlus } from 'react-icons/fi';

const SignupForm = () => {
  const navigate = useNavigate();
  const { setAuth, setLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateSignupForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      const response = await authService.signup({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      
      console.log('✅ Signup response:', response); // Debug log
      
      // FIX: Directly use response.data which contains user and token
      const userData = response.data;
      const token = userData.token;
      
      // Create user object without token
      const { token: _, ...user } = userData;
      
      setAuth(user, token);
      
      toast.success(TOAST_MESSAGES.SIGNUP_SUCCESS);
      navigate('/chat');
      
    } catch (error) {
      console.error('Signup error:', error);
      
      if (error.status === 400 && error.data?.message?.includes('already exists')) {
        setErrors({
          email: 'Email already registered'
        });
        toast.error('Email already registered');
      } else {
        toast.error(error.message || TOAST_MESSAGES.SIGNUP_ERROR);
      }
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit} className="bg-white shadow-xl rounded-2xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
            Create Account
          </h2>
          <p className="text-gray-600 mt-2">Join AddA today!</p>
        </div>

        {/* Name Field */}
        <Input
          type="text"
          name="name"
          label="Full Name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Enter your full name"
          icon={<FiUser className="w-5 h-5 text-gray-400" />}
          required
          autoComplete="name"
        />

        {/* Email Field */}
        <Input
          type="email"
          name="email"
          label="Email Address"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          placeholder="Enter your email"
          icon={<FiMail className="w-5 h-5 text-gray-400" />}
          required
          autoComplete="email"
        />

        {/* Password Field */}
        <div className="relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            name="password"
            label="Password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Create a password"
            icon={<FiLock className="w-5 h-5 text-gray-400" />}
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-11 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>

        {/* Confirm Password Field */}
        <div className="relative">
          <Input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            label="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            placeholder="Confirm your password"
            icon={<FiLock className="w-5 h-5 text-gray-400" />}
            required
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-11 text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>

        {/* Password Requirements */}
        <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded-lg">
          <p className="font-medium text-gray-700">Password must:</p>
          <p className={formData.password.length >= 6 ? 'text-green-600' : ''}>
            ✓ Be at least 6 characters
          </p>
          <p className={/[A-Za-z]/.test(formData.password) ? 'text-green-600' : ''}>
            ✓ Contain at least one letter
          </p>
          <p className={/\d/.test(formData.password) ? 'text-green-600' : ''}>
            ✓ Contain at least one number
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          disabled={isSubmitting}
          loading={isSubmitting}
          icon={FiUserPlus}
        >
          {isSubmitting ? 'Creating Account...' : 'Sign Up'}
        </Button>

        {/* Login Link */}
        <p className="text-center text-gray-600 text-sm">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-700 font-semibold"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default SignupForm;