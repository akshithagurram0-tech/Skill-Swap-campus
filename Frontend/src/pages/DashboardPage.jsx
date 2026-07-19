import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { useSocketContext } from "../context/SocketContext";

export default function DashboardPage() {
    const { user, logout, updateUser } = useAuth();
    const { notifications } = useSocketContext();
    const navigate = useNavigate();

    const [skillsOffered, setSkillsOffered] = useState([]);
    const [skillsRequired, setSkillsRequired] = useState([]);
    const [newOffered, setNewOffered] = useState("");
    const [newRequired, setNewRequired] = useState("");
    const [status, setStatus] = useState("");
    const [matches, setMatches] = useState([]);
    const [matchesLoading, setMatchesLoading] = useState(true);
    const [receivedReviews, setReceivedReviews] = useState([]);
    const [reviewDrafts, setReviewDrafts] = useState({});

    async function loadMatches() {
        setMatchesLoading(true);
        const res = await api.get("/api/matches");
        setMatches(res.data);
        setMatchesLoading(false);
    }

    async function loadReceivedReviews(userId) {
        const res = await api.get(`/api/reviews/user/${userId}`);
        setReceivedReviews(res.data);
    }

    useEffect(() => {
        async function loadProfile() {
            const res = await api.get("/api/users/me");
            updateUser(res.data);
            setSkillsOffered(res.data.skills_offered || []);
            setSkillsRequired(res.data.skills_required || []);
            loadReceivedReviews(res.data.id);
        }
        loadProfile();
        loadMatches();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function respondToMatch(matchId, newStatus) {
        await api.patch(`/api/matches/${matchId}/status`, { status: newStatus });
        loadMatches();
    }

    function updateReviewDraft(matchId, field, value) {
        setReviewDrafts((prev) => ({
            ...prev,
            [matchId]: { rating: 5, comment: "", ...prev[matchId], [field]: value }
        }));
    }

    async function submitReview(matchId) {
        const draft = reviewDrafts[matchId] || { rating: 5, comment: "" };
        await api.post("/api/reviews", {
            match_id: matchId,
            rating: draft.rating,
            comment: draft.comment
        });
        setReviewDrafts((prev) => {
            const next = { ...prev };
            delete next[matchId];
            return next;
        });
        loadMatches();
        if (user?.id) loadReceivedReviews(user.id);
    }

    function addSkill(list, setList, value, clear) {
        const skill = value.trim().toLowerCase();
        if (!skill || list.includes(skill)) return;
        setList([...list, skill]);
        clear("");
    }

    function removeSkill(list, setList, skill) {
        setList(list.filter((s) => s !== skill));
    }

    async function saveSkills() {
        setStatus("Saving...");
        const res = await api.put("/api/users/me", {
            skills_offered: skillsOffered,
            skills_required: skillsRequired
        });
        updateUser(res.data);
        setStatus("Saved!");
        setTimeout(() => setStatus(""), 1500);
        loadMatches();
    }

    function handleLogout() {
        logout();
        navigate("/login");
    }

    return (
        <div>
            <div className="welcome-bar">
                <p>
                    Welcome, {user?.name} ({user?.email})
                    {" "}<span className="rating-badge">⭐ {user?.rating ?? 0} ({receivedReviews.length} reviews)</span>
                </p>
                <button onClick={handleLogout}>Logout</button>
            </div>

            <div className="section">
                <h2>Skills You Can Teach</h2>
                <div className="chip-list">
                    {skillsOffered.map((skill) => (
                        <span key={skill} className="chip">
                            {skill}
                            <button onClick={() => removeSkill(skillsOffered, setSkillsOffered, skill)}>x</button>
                        </span>
                    ))}
                </div>
                <div className="inline-form">
                    <input
                        type="text"
                        placeholder="e.g. Python"
                        value={newOffered}
                        onChange={(e) => setNewOffered(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addSkill(skillsOffered, setSkillsOffered, newOffered, setNewOffered)}
                    />
                    <button onClick={() => addSkill(skillsOffered, setSkillsOffered, newOffered, setNewOffered)}>Add</button>
                </div>
            </div>

            <div className="section">
                <h2>Skills You Want to Learn</h2>
                <div className="chip-list">
                    {skillsRequired.map((skill) => (
                        <span key={skill} className="chip">
                            {skill}
                            <button onClick={() => removeSkill(skillsRequired, setSkillsRequired, skill)}>x</button>
                        </span>
                    ))}
                </div>
                <div className="inline-form">
                    <input
                        type="text"
                        placeholder="e.g. React"
                        value={newRequired}
                        onChange={(e) => setNewRequired(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addSkill(skillsRequired, setSkillsRequired, newRequired, setNewRequired)}
                    />
                    <button onClick={() => addSkill(skillsRequired, setSkillsRequired, newRequired, setNewRequired)}>Add</button>
                </div>
            </div>

            <div className="section">
                <button onClick={saveSkills}>Save Skills</button>
                {status && <span className="status-text"> {status}</span>}
            </div>

            <div className="section">
                <h2>Skill Matches</h2>
                {matchesLoading && <p className="muted-text">Loading matches...</p>}
                {!matchesLoading && matches.length === 0 && (
                    <p className="muted-text">No matches yet. Add skills above to find a match.</p>
                )}
                <div className="match-list">
                    {matches.map((match) => (
                        <div key={match.id} className="match-card">
                            <p>
                                {match.direction === "learning" ? (
                                    <>🤝 You can learn <b>{match.matched_skill}</b> from <b>{match.with_user?.name}</b></>
                                ) : (
                                    <>🤝 You can teach <b>{match.matched_skill}</b> to <b>{match.with_user?.name}</b></>
                                )}
                            </p>
                            <p className="match-status">Status: {match.status}</p>
                            <Link
                                to={`/chat/${match.with_user?.id}`}
                                state={{ name: match.with_user?.name }}
                                className="chat-link"
                            >
                                💬 Chat with {match.with_user?.name}
                                {notifications.filter((n) => n.userId === match.with_user?.id).length > 0 && (
                                    <span className="match-badge">
                                        {notifications.filter((n) => n.userId === match.with_user?.id).length}
                                    </span>
                                )}
                            </Link>
                            {match.status === "accepted" && (
                                <Link
                                    to={`/call/${match.with_user?.id}`}
                                    state={{ name: match.with_user?.name }}
                                    className="chat-link call-link"
                                >
                                    📹 Video Call
                                </Link>
                            )}
                            {match.status === "pending" && (
                                <div className="match-actions">
                                    <button onClick={() => respondToMatch(match.id, "accepted")}>Accept</button>
                                    <button className="decline-btn" onClick={() => respondToMatch(match.id, "declined")}>Decline</button>
                                </div>
                            )}
                            {match.status === "accepted" && !match.already_reviewed && (
                                <div className="review-form">
                                    <select
                                        value={reviewDrafts[match.id]?.rating ?? 5}
                                        onChange={(e) => updateReviewDraft(match.id, "rating", Number(e.target.value))}
                                    >
                                        {[5, 4, 3, 2, 1].map((n) => (
                                            <option key={n} value={n}>{"⭐".repeat(n)}</option>
                                        ))}
                                    </select>
                                    <input
                                        type="text"
                                        placeholder="Leave a comment"
                                        value={reviewDrafts[match.id]?.comment ?? ""}
                                        onChange={(e) => updateReviewDraft(match.id, "comment", e.target.value)}
                                    />
                                    <button onClick={() => submitReview(match.id)}>Submit Review</button>
                                </div>
                            )}
                            {match.status === "accepted" && match.already_reviewed && (
                                <p className="muted-text">You already reviewed this exchange.</p>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="section">
                <h2>Reviews You've Received</h2>
                {receivedReviews.length === 0 && (
                    <p className="muted-text">No reviews yet.</p>
                )}
                <div className="match-list">
                    {receivedReviews.map((review) => (
                        <div key={review.id} className="review-card">
                            <p>{"⭐".repeat(review.rating)} <b>{review.reviewer?.name}</b></p>
                            {review.comment && <p className="muted-text">"{review.comment}"</p>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
