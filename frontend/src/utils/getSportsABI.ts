import axios from "axios";
const getSportsABI = async () => {
    const response = await axios.get(
        "https://nbamockapi-git-main-luizoamorim.vercel.app/sportsABI",
    );
    return response.data;
};

export default getSportsABI;
