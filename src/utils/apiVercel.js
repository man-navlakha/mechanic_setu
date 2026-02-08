import axios from "axios";

const apiVercel = axios.create({
    baseURL: "https://mechanic-setu-backend.vercel.app/api",
    withCredentials: true,
});

export default apiVercel;
