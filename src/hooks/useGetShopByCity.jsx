import React, { useEffect } from "react";
import { serverUrl } from "../App";
import { useDispatch, useSelector } from "react-redux";
import { setShopsInMyCity } from "../redux/userSlice";
import axios from "axios";

function useGetShopByCity() {
  const dispatch = useDispatch();
  const { currentCafeteria, userData } = useSelector((state) => state.user);
  useEffect(() => {
    if (!userData?._id) {
      return;
    }

    const fetchShops = async () => {
      try {
        const url = currentCafeteria
          ? `${serverUrl}/api/shop/get-by-city/${currentCafeteria}`
          : `${serverUrl}/api/shop/get-all-shops`;

        const result = await axios.get(url, {
          withCredentials: true,
        });
        dispatch(setShopsInMyCity(result.data));
      } catch (error) {

      }
    };

    fetchShops();
  }, [currentCafeteria, userData?._id]);
}

export default useGetShopByCity;
