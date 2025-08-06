import { create } from 'zustand';
import apiClient from '../services/api.client';
import toast from 'react-hot-toast';

const useTeamStore = create((set, get) => ({
  // State
  teams: [],
  currentTeam: null,
  members: [],
  invitations: [],
  isLoading: false,
  error: null,

  // Actions
  fetchTeams: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/teams');
      
      set({
        teams: response.data.teams,
        isLoading: false,
        error: null
      });

      return response.data.teams;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to fetch teams';
      set({
        isLoading: false,
        error: errorMessage
      });
      return [];
    }
  },

  createTeam: async (teamData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post('/teams', teamData);
      
      set(state => ({
        teams: [...state.teams, response.data],
        currentTeam: response.data,
        isLoading: false,
        error: null
      }));

      toast.success('Team created successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to create team';
      set({
        isLoading: false,
        error: errorMessage
      });
      toast.error(errorMessage);
      return null;
    }
  },

  updateTeam: async (teamId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put(`/teams/${teamId}`, updates);
      
      set(state => ({
        teams: state.teams.map(team => 
          team.id === teamId ? response.data : team
        ),
        currentTeam: state.currentTeam?.id === teamId ? response.data : state.currentTeam,
        isLoading: false,
        error: null
      }));

      toast.success('Team updated successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to update team';
      set({
        isLoading: false,
        error: errorMessage
      });
      toast.error(errorMessage);
      return null;
    }
  },

  deleteTeam: async (teamId) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/teams/${teamId}`);
      
      set(state => ({
        teams: state.teams.filter(team => team.id !== teamId),
        currentTeam: state.currentTeam?.id === teamId ? null : state.currentTeam,
        isLoading: false,
        error: null
      }));

      toast.success('Team deleted successfully!');
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to delete team';
      set({
        isLoading: false,
        error: errorMessage
      });
      toast.error(errorMessage);
      return false;
    }
  },

  fetchTeamMembers: async (teamId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/teams/${teamId}/members`);
      
      set({
        members: response.data.members,
        isLoading: false,
        error: null
      });

      return response.data.members;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to fetch team members';
      set({
        isLoading: false,
        error: errorMessage
      });
      return [];
    }
  },

  inviteMember: async (teamId, email, role = 'MEMBER') => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post(`/teams/${teamId}/invite`, { email, role });
      
      set(state => ({
        invitations: [...state.invitations, response.data],
        isLoading: false,
        error: null
      }));

      toast.success(`Invitation sent to ${email}!`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to send invitation';
      set({
        isLoading: false,
        error: errorMessage
      });
      toast.error(errorMessage);
      return null;
    }
  },

  removeMember: async (teamId, userId) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/teams/${teamId}/members/${userId}`);
      
      set(state => ({
        members: state.members.filter(member => member.userId !== userId),
        isLoading: false,
        error: null
      }));

      toast.success('Member removed successfully!');
      return true;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to remove member';
      set({
        isLoading: false,
        error: errorMessage
      });
      toast.error(errorMessage);
      return false;
    }
  },

  updateMemberRole: async (teamId, userId, role) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put(`/teams/${teamId}/members/${userId}`, { role });
      
      set(state => ({
        members: state.members.map(member => 
          member.userId === userId ? { ...member, role } : member
        ),
        isLoading: false,
        error: null
      }));

      toast.success('Member role updated successfully!');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Failed to update member role';
      set({
        isLoading: false,
        error: errorMessage
      });
      toast.error(errorMessage);
      return null;
    }
  },

  switchTeam: (teamId) => {
    const team = get().teams.find(t => t.id === teamId);
    if (team) {
      set({ currentTeam: team });
      localStorage.setItem('currentTeamId', teamId);
      toast.success(`Switched to ${team.name}`);
    }
  },

  clearError: () => set({ error: null })
}));

export default useTeamStore;