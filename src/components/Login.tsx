import React, { useState } from 'react';
import { observer } from 'mobx-react';
import Editor from '../wmf/editor/editor';
import Select, { ValueType } from 'react-select';
import { Modal } from 'react-bootstrap';
import { Repository } from '../wmf/repository/repository';

export const Login: React.FC<{ editor: Editor }> = observer((props) => {

  const initList: string[] = [];
  const [databases, setDatabases] = useState(initList);

  const { repository } = props.editor;
  const { loggedIn, loginFailed } = repository;

  function LoginModal() {

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    function updateField(event: React.ChangeEvent<HTMLInputElement>) {
      if (event.target.name === 'username') {
        setUsername(event.target.value);
      }
      if (event.target.name === 'password') {
        setPassword(event.target.value);
      }
    }
  
      function handleLogin(event: React.FormEvent<HTMLFormElement>) {
      repository.login(username, password)
        .then(() => setDatabases(repository.listDatabases()))
        .catch((err) => console.log(err))
      event.preventDefault();
    }

      return (
      <Modal show={!loggedIn}>
        <h1>Login</h1>
        <form onSubmit={handleLogin}>
          <table>
            <tbody>
              <tr>
                <td>
                  <label>Username:</label>
                </td>
                <td>
                  <input type='text' name='username' value={username} onChange={updateField} />
                </td>
              </tr>
              <tr>
                <td>
                  <label>Password:</label>
                </td>
                <td>
                  <input type='password' name='password' value={password} onChange={updateField} />
                </td>
              </tr>
              <tr>
                <td></td>
                <td>
                  <input type='submit' value='Login' />
                </td>
              </tr>
            </tbody>
          </table>
        </form>
        {loginFailed ? <p>Login failed!</p> : <p></p>}
      </Modal>
    )
  }

  const SelectDatabaseModal: React.FC<{ repository: Repository }> = observer((props) => {
    const options = databases.map((db) => ({ value: db, label: db }));
    const currentDatabase = props.repository.database;
    const currentSelection = currentDatabase ? { value: currentDatabase, label: currentDatabase } : undefined;

    const handleDatabaseSelection = (selection: ValueType<{ value: string, label: string}>) => {
      if (selection) {
        const selected = (selection as {value: string, label: string}).value;
        repository.selectDatabase(selected);
      }
    }

    return (
      <Modal show={loggedIn && !currentDatabase}>
        <h2>Select repository</h2>
        <Select key='databaseSelect' styles={{ container: (provided) => ({ ...provided, width: '100%' }) }}
          placeholder={'Select repository...'}
          options={options}
          onChange={handleDatabaseSelection}
          value={currentSelection}
          closeMenuOnSelect={true} 
          />
        <p>Current selection: {repository.database}</p>
        <button>Go</button>
      </Modal>
    )
  });

  return (
    <>
      <LoginModal />
      <SelectDatabaseModal repository={repository} />
    </>
  )
});
