import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import { validateLoginForm } from '../../utils/validators';
import { TOAST_MESSAGES } from '../../utils/constants';
import Button from '../common/Button';
import Input from '../common/Input';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';

const LoginForm = () => {
  const navigate = useNavigate();
  const { setAuth, setLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validation = validateLoginForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      const response = await authService.login(formData);
      console.log('✅ Login response:', response);
      
      // FIX: Directly use response.data which contains user and token
      const userData = response.data;
      const token = userData.token;
      
      // Create user object without token
      const { token: _, ...user } = userData;
      
      setAuth(user, token);
      
      toast.success(TOAST_MESSAGES.LOGIN_SUCCESS);
      navigate('/chat');
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || TOAST_MESSAGES.LOGIN_ERROR);
      
      if (error.status === 401) {
        setErrors({
          email: ' ',
          password: 'Invalid email or password'
        });
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
            Welcome Back!
          </h2>
          <p className="text-gray-600 mt-2">Sign in to continue to AddA</p>
        </div>

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
            placeholder="Enter your password"
            icon={<FiLock className="w-5 h-5 text-gray-400" />}
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-11 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? '👁️' : '👁️‍🗨️'}
          </button>
        </div>

        {/* Forgot Password Link */}
        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          fullWidth
          size="lg"
          disabled={isSubmitting}
          loading={isSubmitting}
          icon={FiLogIn}
        >
          {isSubmitting ? 'Signing in...' : 'Sign In'}
        </Button>

        {/* Sign Up Link */}
        <p className="text-center text-gray-600 text-sm">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-primary-600 hover:text-primary-700 font-semibold"
          >
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
};

export default LoginForm;