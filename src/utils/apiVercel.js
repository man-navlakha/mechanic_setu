import axios from "axios";

const apiVercel = axios.create({
    baseURL: "http://localhost:3000/api",
    withCredentials: true,
});

export default apiVercel;
