const TestPage = () => {
  return (
    <div style={{ 
      backgroundColor: 'red', 
      color: 'white', 
      padding: '50px', 
      fontSize: '24px',
      minHeight: '100vh'
    }}>
      <h1>TEST PAGE - IF YOU SEE THIS, ROUTING WORKS!</h1>
      <p>This is a test page to verify routing and rendering.</p>
      <p>Current path: {window.location.pathname}</p>
    </div>
  );
};

export default TestPage;
