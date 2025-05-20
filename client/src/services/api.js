import axios from 'axios';

const API_URL = '/api';

const api = {
  getSchemes: () => {
    return axios.get(`${API_URL}/schemes`);
  },
  
  submitOrder: (orderData) => {
    return axios.post(`${API_URL}/process-order`, orderData);
  },

  registerUCC: (clientDetails) => {
    return axios.post(`${API_URL}/register-ucc`, clientDetails);
  },

  getOrderStatusReport: (reportParams) => {
    return axios.post(`${API_URL}/order-status-report`, reportParams);
  },

  cancelOrder: (cancellationDetails) => {
    return axios.post(`${API_URL}/order-cancellation`, cancellationDetails);
  },
  
  downloadSchemeMaster: (options = {}) => {
    return axios.post(`${API_URL}/download-scheme-master`, options);
  },
  
  getSchemeMasterJson: (options = {}) => {
    let url = `${API_URL}/scheme-master-json`;
    if (options.fileName || options.limit) {
      const params = new URLSearchParams();
      if (options.fileName) params.append('fileName', options.fileName);
      if (options.limit) params.append('limit', options.limit);
      url += `?${params.toString()}`;
    }
    return axios.get(url);
  },
  
  getSchemeMasterRawUrl: (fileName) => {
    let url = `${API_URL}/scheme-master-raw`;
    if (fileName) {
      url += `?fileName=${encodeURIComponent(fileName)}`;
    }
    return url;
  },
  
  getSchemeMasterFiles: () => {
    return axios.get(`${API_URL}/scheme-master-files`);
  }
};

export default api; 