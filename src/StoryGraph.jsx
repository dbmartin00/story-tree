import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import cytoscape from 'cytoscape';

export default function StoryGraph() {
  const cyRef = useRef(null);
  const containerRef = useRef(null);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showButton, setShowButton] = useState(false);
  const [selectedStory, setSelectedStory] = useState(null);

  useEffect(() => {
    async function fetchStories() {
      try {
        const res = await axios.get('https://hylsu7x6fealllgbdh655htpou0lljkv.lambda-url.us-west-2.on.aws/');
        const stories = res.data;
        setStories(stories);

        const elements = [];

        for (const story of stories) {
          elements.push({
            data: { id: story.id, label: story.title || story.id }
          });
        }

        for (const story of stories) {
          for (const option of story.options || []) {
            elements.push({
              data: { source: option.target, target: story.id }
            });
          }
        }

        const cy = cytoscape({
          container: containerRef.current,
          elements,
          style: [
            {
              selector: 'node',
              style: {
                'background-color': '#0074D9',
                'label': 'data(label)',
                'color': '#fff',
                'text-valign': 'center',
                'text-halign': 'center',
                'text-outline-color': '#0074D9',
                'text-outline-width': 2,
                'font-size': 10,
                'width': 40,
                'height': 40
              }
            },
            {
              selector: 'edge',
              style: {
                'width': 2,
                'line-color': '#ccc',
                'target-arrow-shape': 'triangle',
                'target-arrow-color': '#ccc',
                'curve-style': 'bezier'
              }
            }
          ],
          layout: {
            name: 'breadthfirst',
            directed: true,
            padding: 80,
            spacingFactor: 0.6,
            nodeDimensionsIncludeLabels: true,
            fit: true,
            roots: ['1-1'],
            animate: false,
            transform: function (node, position) {
              return { x: position.x, y: -position.y };
            }
          }
        });

        cy.on('tap', 'node', (event) => {
          const nodeId = event.target.id();
          const story = stories.find(s => s.id === nodeId);
          if (story) {
            setSelectedStory(story);
          }
        });

        cyRef.current = cy;
        setLoading(false);
        setShowButton(true);
      } catch (err) {
        setError('Failed to load stories: ' + err.message);
      }
    }

    fetchStories();
  }, []);

  const handleExport = () => {
    if (!cyRef.current) return;
    const jpg64 = cyRef.current.jpg({
      bg: 'white',
      full: true,
      scale: 2,
      quality: 1.0
    });

    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`<img src="${jpg64}" alt="Story Graph" />`);
      newWindow.document.title = 'Story Graph Image';
    } else {
      alert('Popup blocked. Please allow popups to view the exported image.');
    }
  };

  const closeDialog = () => {
    setSelectedStory(null);
  };

  const jumpToStory = (targetId) => {
    const story = stories.find(s => s.id === targetId);
    if (story) {
      setSelectedStory(story);
    }
  };

  return (
    <div style={{ height: '100vh', position: 'relative', fontFamily: 'sans-serif' }}>
      {loading && <div style={{ textAlign: 'center', padding: '2em', fontSize: '1.5em' }}>Loading story structure...</div>}
      {error && <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>}
      <div ref={containerRef} style={{ width: '100%', height: '100%', display: loading ? 'none' : 'block' }} />

      {showButton && (
        <button
          onClick={handleExport}
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 10,
            padding: '8px 14px',
            fontSize: 14,
            background: '#0074D9',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          Save as JPEG
        </button>
      )}

      {selectedStory && (
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            padding: '1.5em',
            borderRadius: 8,
            boxShadow: '0 0 10px rgba(0,0,0,0.3)',
            width: '80%',
            maxWidth: '600px',
            zIndex: 100
          }}
        >
          <h2>{selectedStory.title || selectedStory.id}</h2>
          <p style={{ whiteSpace: 'pre-line' }}>{selectedStory.content}</p>
          <div style={{ marginTop: '1em' }}>
            <strong>Options:</strong>
            <ul>
              {(selectedStory.options || []).map((opt, i) => (
                <li key={i}>
                  <a href="#" onClick={(e) => { e.preventDefault(); jumpToStory(opt.target); }}>
                    {opt.text || opt.target}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={closeDialog}
            style={{
              marginTop: '1em',
              background: '#aaa',
              color: 'white',
              border: 'none',
              padding: '0.5em 1em',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

