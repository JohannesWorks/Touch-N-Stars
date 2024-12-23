import axios from "axios";

const BASE_URL = "http://192.168.2.128:5000/v2/api";
const API_URL = "http://192.168.2.128:5000/api/";
const TARGETPIC_URL = "http://192.168.2.128:5000/api/targetpic";

const apiService = {
  // Backend reachability check
  async isBackendReachable() {
    try {
      const response = await axios.get(`${BASE_URL}/version`);
      return response.status === 200;
    } catch (error) {
      console.error("Error reaching backend:", error.message);
      return false;
    }
  },

  //-------------------------------------  Mount ---------------------------------------
  // Mount actions
  mountAction(action) {
    return this._simpleGetRequest(`${BASE_URL}/equipment/mount/${action}`);
  },

  // Mount Tracking Mode
  //0=Siderial, 1=Lunar, 2=Solar, 3=King, 4=Stopped)
  //http://192.168.2.128:1888/v2/api/equipment/mount/tracking?mode=0
  async setTrackingMode(TrackingMode) {
    try {
      const response = await axios.get(`${BASE_URL}/equipment/mount/tracking`, {
        params: { mode: TrackingMode, },
      });
      //console.log(response.data);
      return response.data;
    } catch (error) {
      console.error("Error switch profil:", error);
      throw error;
    }
  },

  //-------------------------------------  profile ---------------------------------------
  // profile actions
  profileAction(action) {
    return this._simpleGetRequest(`${BASE_URL}/profile/${action}`);
  },

  // Profil Switch
  async profileSwitch(profileid) {
    try {
      const response = await axios.get(`${BASE_URL}/profile/switch`, {
        params: { profileid: profileid, },
      });
      //console.log(response.data);
      return response.data;
    } catch (error) {
      console.error("Error switch profil:", error);
      throw error;
    }
  },

  //-------------------------------------  application ---------------------------------------
  // application actions
  async applicatioTabSwitch(tab) {
    try {
      const response = await axios.get(`${BASE_URL}/application/switch-tab`, {
        params: { tab: tab, },
      });
      //console.log(response.data);
      return response.data;
    } catch (error) {
      console.error("Error open application:", error);
      throw error;
    }
  },

  //-------------------------------------  Camera ---------------------------------------
  // Camera actions
  cameraAction(action) {
    return this._simpleGetRequest(`${BASE_URL}/equipment/camera/${action}`);
  },

  // Start capture
  async startCapture(duration,gain) {
    try {
      const response = await axios.get(`${BASE_URL}/equipment/camera/capture`, {
        params: { 
          duration : duration,
          gain : gain
          },
      });
      return response.data;
    } catch (error) {
      console.error("Error starting capture:", error);
      throw error;
    }
  },

  // Get capture result
  async getCaptureResult() {
    try {
      const response = await axios.get(`${BASE_URL}/equipment/camera/capture`, {
        params: { getResult: true, quality: 80 },
      });
      return response.data;
    } catch (error) {
      console.error("Error retrieving capture result:", error);
      throw error;
    }
  },
  // Set Temp / Start Cooling 
  async startCooling(temp) {
    try {
      const response = await axios.get(`${BASE_URL}/equipment/camera/cool`, {
        params: { temperature: temp },
      });
      return response.data;
    } catch (error) {
      console.error("Error retrieving capture result:", error);
      throw error;
    }
  },
  // Stopp Cooling 
  async stoppCooling() {
    try {
      const response = await axios.get(`${BASE_URL}/equipment/camera/cool`, {
        params: { cancel: true },
      });
      return response.data;
    } catch (error) {
      console.error("Error retrieving capture result:", error);
      throw error;
    }
  },
  //  Start Stopp Warming 
  async startStoppWarming(cancel) { // cancel muss true oder false sein
    try {
      const response = await axios.get(`${BASE_URL}/equipment/camera/warm`, {
        params: { cancel: cancel },
      });
      return response.data;
    } catch (error) {
      console.error("Error retrieving capture result:", error);
      throw error;
    }
  },


  //-------------------------------------  focuser ---------------------------------------
  // Focuser actions
  focusAction(action) {
    return this._simpleGetRequest(`${BASE_URL}/equipment/focuser/${action}`);
  },

  focuserAfAction(action) {
    return this._simpleGetRequest(`${API_URL}autofocus?${action}`);
  },

  focuserLastAf() {
    return this._simpleGetRequest(`${BASE_URL}/equipment/focuser/last-af`);
  },

  // Move focuser
  async moveFocuser(position) {
    try {
      const response = await axios.get(`${BASE_URL}/equipment/focuser/move`, {
        params: { position },
      });
      return response.data;
    } catch (error) {
      console.error("Error moving focuser:", error);
      throw error;
    }
  },

  //-------------------------------------  Framing ---------------------------------------
  // Framing actions
  framingAction(action) {
    return this._simpleGetRequest(`${BASE_URL}/framing/${action}`);
  },
  // Slew and center
  async slewAndCenter(RAangle, DECangle, Center) {
    try {
      await axios.get(`${BASE_URL}/framing/set-coordinates`, {
        params: { RAangle, DECangle },
      });

      const params = Center ? { slew_option: "Center" } : {};
      const response = await axios.get(`${BASE_URL}/framing/slew`, { params });
      return response.data;
    } catch (error) {
      console.error("Error controlling mount:", error);
      throw error;
    }
  },

  // NGC search
  async searchNGC(query, limit = 10) {
    return this._getWithParams(`${API_URL}ngc/search`, { query, limit });
  },

  async getNgcCache() {
    return this._simpleGetRequest(`${API_URL}ngc/cache`);
  },

  async updateNgcCache(data) {
    try {
      const response = await axios.post(`${API_URL}ngc/cache`, { data });
      return response.data;
    } catch (error) {
      console.error("Error updating NGC cache:", error);
      throw error;
    }
  },

  // Load target picture
  async searchTargetPic(width, height, fov, ra, dec) {
    try {
      const response = await axios.get(TARGETPIC_URL, {
        params: { width, height, fov, ra, dec, hips: "CDS/P/DSS2/color", projection: "STG", format: "jpg" },
        responseType: "blob",
      });
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error("Error retrieving target picture:", error);
      throw error;
    }
  },

  //-------------------------------------  guider ---------------------------------------
  // Guider actions
  guiderAction(action) {
    return this._simpleGetRequest(`${BASE_URL}/equipment/guider/${action}`);
  },
  // Fetch guider chart data
  async fetchGuiderChartData() {
    try {
      const response = await axios.get(`${API_URL}guider-data`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Error fetching guider data:", error);
      return { success: false, message: "Error fetching guider data" };
    }
  },

  //-------------------------------------  Logs ---------------------------------------
  async getLastLogs(count,level) {
    try {
      const response = await axios.get(`${API_URL}logs`, {
        params: { count, level },
      });
      return response.data;
    } catch (error) {
      console.error("Error retrieving logs result:", error);
      throw error;
    }
  },
  //-------------------------------------  Helper ---------------------------------------
  // Helper methods
  _simpleGetRequest(url) {
    return axios
      .get(url)
      .then((response) => response.data)
      .catch((error) => {
        console.error(`Error in GET request to ${url}:`, error);
        throw error;
      });
  },

  _getWithParams(url, params) {
    return axios
      .get(url, { params })
      .then((response) => response.data)
      .catch((error) => {
        console.error(`Error in GET request to ${url} with params:`, error);
        throw error;
      });
  },
};

export default apiService;
