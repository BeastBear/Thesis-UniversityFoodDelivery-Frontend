import React, { useEffect } from "react";
import { serverUrl } from "../App";
import { useDispatch, useSelector } from "react-redux";
import { setAllShops, setShopLoading } from "../redux/userSlice";
import axios from "axios";

function useGetAllShops() {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    if (!userData?._id) {
      return;
    }

    const fetchAllShops = async () => {
      dispatch(setShopLoading(true));
      try {
        const result = await axios.get(`${serverUrl}/api/shop/get-all-shops`, {
          withCredentials: true,
        });
        dispatch(setAllShops(result.data));
      } catch (error) {

      } finally {
        dispatch(setShopLoading(false));
      }
    };
    fetchAllShops();
  }, [dispatch, userData?._id]);
}

export default useGetAllShops;
