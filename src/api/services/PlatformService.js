import { ApiConfig } from "../apiConfig/apiConfig";
import { ApiCallGet } from "../apiConfig/apiCall";

const PlatformService = {
  getPlatformStatus: async () => {
    const { baseUrl, platformStatus } = ApiConfig;
    const url = baseUrl + platformStatus;
    const headers = { "Content-Type": "application/json" };
    return ApiCallGet(url, headers);
  },
};

export default PlatformService;
