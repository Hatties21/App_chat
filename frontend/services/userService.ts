import api from "@/lib/api";

export interface SearchUser {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export const userService = {
  searchUsers: async (query: string): Promise<{ users: SearchUser[]; total: number }> => {
    const { data } = await api.get("/api/users/search", {
      params: { q: query },
    });
    return data;
  },
};
