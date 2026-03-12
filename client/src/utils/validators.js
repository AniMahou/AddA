// Email validation
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Password validation (min 6 chars, at least 1 letter and 1 number)
  export const isValidPassword = (password) => {
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    return passwordRegex.test(password);
  };
  
  // Name validation
  export const isValidName = (name) => {
    return name && name.length >= 2 && name.length <= 50 && /^[a-zA-Z\s]+$/.test(name);
  };
  
  // Message validation
  export const isValidMessage = (message) => {
    return message && message.length > 0 && message.length <= 5000;
  };
  
  // File validation
  export const isValidFileType = (file, allowedTypes) => {
    return allowedTypes.includes(file.type);
  };
  
  // File size validation
  export const isValidFileSize = (file, maxSize) => {
    return file.size <= maxSize;
  };
  
  // URL validation
  export const isValidUrl = (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
  
  // Phone number validation (basic)
  export const isValidPhone = (phone) => {
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone);
  };
  
  // Bio validation
  export const isValidBio = (bio) => {
    return !bio || bio.length <= 200;
  };
  
  // Search query validation
  export const isValidSearchQuery = (query) => {
    return query && query.length >= 1 && query.length <= 50;
  };
  
  // Validate login form
  export const validateLoginForm = (data) => {
    const errors = {};
    
    if (!data.email) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(data.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!data.password) {
      errors.password = 'Password is required';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };
  
  // Validate signup form
  export const validateSignupForm = (data) => {
    const errors = {};
    
    if (!data.name) {
      errors.name = 'Name is required';
    } else if (!isValidName(data.name)) {
      errors.name = 'Name must be 2-50 characters and contain only letters and spaces';
    }
    
    if (!data.email) {
      errors.email = 'Email is required';
    } else if (!isValidEmail(data.email)) {
      errors.email = 'Invalid email format';
    }
    
    if (!data.password) {
      errors.password = 'Password is required';
    } else if (!isValidPassword(data.password)) {
      errors.password = 'Password must be at least 6 characters and contain at least one letter and one number';
    }
    
    if (data.confirmPassword && data.password !== data.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };
  
  // Validate profile form
  export const validateProfileForm = (data) => {
    const errors = {};
    
    if (data.name && !isValidName(data.name)) {
      errors.name = 'Name must be 2-50 characters and contain only letters and spaces';
    }
    
    if (data.bio && !isValidBio(data.bio)) {
      errors.bio = 'Bio cannot exceed 200 characters';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };