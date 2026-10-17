import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { FormEvent } from "react";
import type { AppDispatch, RootState } from "./store/store";
import { addUser, deleteUser, fetchUsers, updateUser } from "./store/counterSlice";
import type { User, UserInput } from "./components/types";
import "./App.css";

type UserFormValues = {
  name: string;
  age: string;
  job: string;
  phone: string;
  avatar: string;
  status: string;
};

const emptyForm: UserFormValues = {
  name: "",
  age: "",
  job: "",
  phone: "",
  avatar: "",
  status: "true",
};

function toFormValues(user: User): UserFormValues {
  return {
    name: user.name ?? "",
    age: user.age === undefined ? "" : String(user.age),
    job: user.job ?? "",
    phone: user.phone ?? "",
    avatar: user.avatar ?? "",
    status: user.status === false ? "false" : "true",
  };
}

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { users, loading, deletingUserIds, error } = useSelector(
    (state: RootState) => state.counter,
  );
  const [search, setSearch] = useState("");
  const [formUser, setFormUser] = useState<User | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formValues, setFormValues] = useState<UserFormValues>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [infoUser, setInfoUser] = useState<User | null>(null);

  useEffect(() => {
    void dispatch(fetchUsers());
  }, [dispatch]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter((user) =>
      [user.name, user.job, user.phone, user.age, user.status, user.id]
        .filter((value) => value !== undefined && value !== null)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [search, users]);

  const openAddForm = () => {
    setFormUser(null);
    setFormValues(emptyForm);
    setFormError(null);
    setIsAdding(true);
  };

  const openEditForm = (user: User) => {
    setFormUser(user);
    setFormValues(toFormValues(user));
    setFormError(null);
    setIsAdding(false);
  };

  const closeForm = () => {
    if (saving) return;
    setFormUser(null);
    setIsAdding(false);
    setFormError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = formValues.name.trim();
    const age = formValues.age.trim() ? Number(formValues.age) : undefined;

    if (!name) {
      setFormError("Name is required.");
      return;
    }
    if (age !== undefined && (!Number.isFinite(age) || age < 0)) {
      setFormError("Enter a valid age.");
      return;
    }

    const payload: UserInput = {
      name,
      ...(age !== undefined ? { age } : {}),
      job: formValues.job.trim(),
      phone: formValues.phone.trim(),
      avatar: formValues.avatar.trim(),
      status: formValues.status === "true",
    };

    setSaving(true);
    setFormError(null);
    try {
      if (formUser?.id !== undefined) {
        await dispatch(updateUser({ id: formUser.id, user: payload })).unwrap();
      } else if (isAdding) {
        await dispatch(addUser(payload)).unwrap();
      }
      closeForm();
    } catch (submitError) {
      setFormError(
        typeof submitError === "string"
          ? submitError
          : submitError instanceof Error
            ? submitError.message
            : "Could not save the user.",
      );
    } finally {
      setSaving(false);
    }
  };

  const setField = (field: keyof UserFormValues, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  return (
    <main className="app">
      <section className="user-panel" aria-labelledby="page-title">
        <div className="user-heading">
          <div>
            <h1 id="page-title">Users</h1>
            <p className="page-description">Manage your user directory</p>
          </div> 
            <button className="primary-button" type="button" onClick={openAddForm}>
              Add user
            </button>
        </div>

        <label className="search-field">
          <span className="visually-hidden">Search users</span>
          <input
            type="search"
            placeholder="Search by name, job, phone, age or ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        {loading && <p role="status">Loading users...</p>}
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        {!loading && !error && users.length === 0 && (
          <p></p>
        )}
        {!loading && users.length > 0 && filteredUsers.length === 0 && (
          <p>No users match “{search}”.</p>
        )}

        {filteredUsers.length > 0 && (
          <div className="user-list">
            {filteredUsers.map((user, index) => (
              <article className="user-card" key={user.id ?? index}>
                {user.avatar && (
                  <img
                    className="user-avatar"
                    src={user.avatar}
                    alt=""
                    loading="lazy"
                  />
                )}
                <div className="user-details">
                  <h2>{user.name ?? `User ${user.id ?? index + 1}`}</h2>
                  {user.job && <p>{user.job}</p>}
                  {user.age !== undefined && <p>Age: {user.age}</p>}
                  {user.phone && <p>Phone: {user.phone}</p>}
                  {user.status !== undefined && (
                    <p>Status: {user.status ? "Active" : "Inactive"}</p>
                  )}
                </div>
                <div className="user-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => setInfoUser(user)}
                  >
                    Info
                  </button>
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={user.id === undefined}
                    onClick={() => openEditForm(user)}
                  >
                    Edit
                  </button>
                  {user.id !== undefined && (
                    <button
                      className="delete-button"
                      type="button"
                      disabled={deletingUserIds.includes(String(user.id))}
                      onClick={() => void dispatch(deleteUser(user.id!))}
                    >
                      {deletingUserIds.includes(String(user.id))
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {
        (isAdding || formUser) && (
          <div className="dialog-backdrop">
            <section
              className="dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="form-title"
            >
              <h2 id="form-title">{isAdding ? "Add user" : "Edit user"}</h2>
              <form onSubmit={(event) => void handleSubmit(event)}>
                <label>
                  Name
                  <input
                    autoFocus
                    required
                    value={formValues.name}
                    onChange={(event) => setField("name", event.target.value)}
                  />
                </label>
                <label>
                  Age
                  <input
                    type="number"
                    min="0"
                    value={formValues.age}
                    onChange={(event) => setField("age", event.target.value)}
                  />
                </label>
                <label>
                  Job
                  <input
                    value={formValues.job}
                    onChange={(event) => setField("job", event.target.value)}
                  />
                </label>
                <label>
                  Phone
                  <input
                    type="tel"
                    value={formValues.phone}
                    onChange={(event) => setField("phone", event.target.value)}
                  />
                </label>
                <label>
                  Avatar URL
                  <input
                    type="url"
                    value={formValues.avatar}
                    onChange={(event) => setField("avatar", event.target.value)}
                  />
                </label>
                <label>
                  Status
                  <select
                    value={formValues.status}
                    onChange={(event) => setField("status", event.target.value)}
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </label>
                {formError && (
                  <p className="error" role="alert">
                    {formError}
                  </p>
                )}
                <div className="dialog-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    disabled={saving}
                    onClick={closeForm}
                  >
                    Cancel
                  </button>
                  <button className="primary-button" type="submit" disabled={saving}>
                    {saving ? "Saving..." : isAdding ? "Add user" : "Save changes"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )
      }

      {
        infoUser && (
          <div className="dialog-backdrop">
            <section
              className="dialog info-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="info-title"
            >
              <h2 id="info-title">{infoUser.name ?? "User information"}</h2>
              <dl>
                {infoUser.id !== undefined && <InfoRow label="ID" value={infoUser.id} />}
                {infoUser.age !== undefined && <InfoRow label="Age" value={infoUser.age} />}
                {infoUser.job && <InfoRow label="Job" value={infoUser.job} />}
                {infoUser.phone && <InfoRow label="Phone" value={infoUser.phone} />}
                {infoUser.status !== undefined && (
                  <InfoRow
                    label="Status"
                    value={infoUser.status ? "Active" : "Inactive"}
                  />
                )}
                {infoUser.avatar && <InfoRow label="Avatar" value={infoUser.avatar} />}
              </dl>
              <div className="dialog-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => setInfoUser(null)}
                >
                  Close
                </button>
              </div>
            </section>
          </div>
        )
      }
    </main >
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="info-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default App;
