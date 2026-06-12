// "use client";

// import { useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { X, Search, Loader2 } from "lucide-react";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import api from "@/lib/axios";
// import { User, Conversation, ApiResponse } from "@/types";
// import { cn, getInitials } from "@/lib/utils";
// import { useChatStore } from "@/stores/chatStore";

// interface NewConversationModalProps {
//   isOpen: boolean;
//   onClose: () => void;
// }

// export const NewConversationModal = ({ isOpen, onClose }: NewConversationModalProps) => {
//   const [search, setSearch] = useState("");
//   const [selected, setSelected] = useState<User | null>(null);
//   const queryClient = useQueryClient();
//   const { setActiveConversation, addConversation } = useChatStore();

//   const { data: users, isLoading } = useQuery({
//     queryKey: ["users", "search", search],
//     queryFn: async () => {
//       if (search.trim().length < 2) return [];
//       const { data } = await api.get<ApiResponse<User[]>>(
//         `/users/search?q=${encodeURIComponent(search)}`
//       );
//       return data.data ?? [];
//     },
//     enabled: search.trim().length >= 2,
//   });

//   const createMutation = useMutation({
//     mutationFn: async (userId: string) => {
//       const { data } = await api.post<ApiResponse<Conversation>>("/conversations", {
//         type: "direct",
//         participantIds: [userId],
//       });
//       return data.data!;
//     },
//     onSuccess: (conversation) => {
//       addConversation(conversation);
//       setActiveConversation(conversation._id);
//       queryClient.invalidateQueries({ queryKey: ["conversations"] });
//       onClose();
//       setSearch("");
//       setSelected(null);
//     },
//   });

//   return (
//     <AnimatePresence>
//       {isOpen && (
//         <>
//           {/* Backdrop */}
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             onClick={onClose}
//             className="fixed inset-0 bg-black/60 z-40"
//           />

//           {/* Modal */}
//           <motion.div
//             initial={{ opacity: 0, scale: 0.95, y: -20 }}
//             animate={{ opacity: 1, scale: 1, y: 0 }}
//             exit={{ opacity: 0, scale: 0.95, y: -20 }}
//             className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 z-50"
//           >
//             {/* Header */}
//             <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
//               <h2 className="text-lg font-semibold text-white">New Conversation</h2>
//               <button
//                 onClick={onClose}
//                 className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors"
//               >
//                 <X className="w-4 h-4" />
//               </button>
//             </div>

//             {/* Search */}
//             <div className="p-4">
//               <div className="relative">
//                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
//                 <input
//                   autoFocus
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                   placeholder="Search by username or email..."
//                   className="w-full bg-gray-700 text-white placeholder-gray-500 rounded-xl pl-9 pr-4 py-2.5 text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                 />
//               </div>
//             </div>

//             {/* Results */}
//             <div className="px-4 pb-4 max-h-64 overflow-y-auto">
//               {isLoading && (
//                 <div className="flex justify-center py-4">
//                   <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
//                 </div>
//               )}

//               {!isLoading && search.trim().length >= 2 && (!users || users.length === 0) && (
//                 <div className="text-center py-6 text-gray-500 text-sm">
//                   No users found
//                 </div>
//               )}

//               {search.trim().length < 2 && (
//                 <div className="text-center py-6 text-gray-500 text-sm">
//                   Type at least 2 characters to search
//                 </div>
//               )}

//               {users?.map((user) => (
//                 <button
//                   key={user._id}
//                   onClick={() => setSelected(user)}
//                   className={cn(
//                     "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left",
//                     selected?._id === user._id
//                       ? "bg-indigo-600/30 border border-indigo-500/50"
//                       : "hover:bg-gray-700"
//                   )}
//                 >
//                   {user.avatar ? (
//                     <img
//                       src={user.avatar}
//                       alt={user.username}
//                       className="w-10 h-10 rounded-full object-cover"
//                     />
//                   ) : (
//                     <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
//                       {getInitials(user.username)}
//                     </div>
//                   )}
//                   <div className="flex-1 min-w-0">
//                     <p className="text-sm font-medium text-white">{user.username}</p>
//                     <p className="text-xs text-gray-400 truncate">{user.email}</p>
//                   </div>
//                   {user.isOnline && (
//                     <div className="w-2 h-2 rounded-full bg-green-500" />
//                   )}
//                 </button>
//               ))}
//             </div>

//             {/* Footer */}
//             {selected && (
//               <div className="px-4 pb-4">
//                 <button
//                   onClick={() => createMutation.mutate(selected._id)}
//                   disabled={createMutation.isPending}
//                   className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
//                 >
//                   {createMutation.isPending ? (
//                     <>
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                       Creating...
//                     </>
//                   ) : (
//                     `Start conversation with ${selected.username}`
//                   )}
//                 </button>
//               </div>
//             )}
//           </motion.div>
//         </>
//       )}
//     </AnimatePresence>
//   );
// };


"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/axios";
import { User, Conversation, ApiResponse } from "@/types";
import { cn, getInitials } from "@/lib/utils";
import { useChatStore } from "@/stores/chatStore";

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewConversationModal = ({ isOpen, onClose }: NewConversationModalProps) => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const queryClient = useQueryClient();
  const { setActiveConversation, addConversation } = useChatStore();

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", "search", search],
    queryFn: async () => {
      if (search.trim().length < 2) return [];
      const { data } = await api.get<ApiResponse<User[]>>(`/users/search?q=${encodeURIComponent(search)}`);
      return data.data ?? [];
    },
    enabled: search.trim().length >= 2,
  });

  const createMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.post<ApiResponse<Conversation>>("/conversations", {
        type: "direct",
        participantIds: [userId],
      });
      return data.data!;
    },
    onSuccess: (conversation) => {
      addConversation(conversation);
      setActiveConversation(conversation._id);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      onClose();
      setSearch("");
      setSelected(null);
    },
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/60 z-40" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-2xl shadow-2xl border z-50"
            style={{ backgroundColor: "var(--bg-secondary)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>New Conversation</h2>
              <button onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "var(--bg-hover)"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <input
                  autoFocus
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by username or email..."
                  className="w-full rounded-xl pl-9 pr-4 py-2.5 text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  style={{
                    backgroundColor: "var(--input-bg)",
                    color: "var(--text-primary)",
                    borderColor: "var(--border)",
                  }}
                />
              </div>
            </div>

            <div className="px-4 pb-4 max-h-64 overflow-y-auto">
              {isLoading && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                </div>
              )}
              {!isLoading && search.trim().length >= 2 && (!users || users.length === 0) && (
                <div className="text-center py-6 text-sm" style={{ color: "var(--text-muted)" }}>No users found</div>
              )}
              {search.trim().length < 2 && (
                <div className="text-center py-6 text-sm" style={{ color: "var(--text-muted)" }}>Type at least 2 characters to search</div>
              )}
              {users?.map((user) => (
                <button key={user._id} onClick={() => setSelected(user)}
                  className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left",
                    selected?._id === user._id ? "bg-indigo-600/30 border border-indigo-500/50" : "hover:bg-[var(--bg-hover)]"
                  )}
                  style={selected?._id === user._id ? {} : { backgroundColor: "transparent" }}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                      {getInitials(user.username)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{user.username}</p>
                    <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{user.email}</p>
                  </div>
                  {user.isOnline && <div className="w-2 h-2 rounded-full bg-green-500" />}
                </button>
              ))}
            </div>

            {selected && (
              <div className="px-4 pb-4">
                <button
                  onClick={() => createMutation.mutate(selected._id)}
                  disabled={createMutation.isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {createMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
                  ) : (
                    `Start conversation with ${selected.username}`
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};