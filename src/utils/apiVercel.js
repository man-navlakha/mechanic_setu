import axios from "axios";

const apiVercel = axios.create({
    baseURL: "/api",
    withCredentials: true,
});

export default apiVercel;
