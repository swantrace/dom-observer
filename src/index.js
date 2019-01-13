(function(Promise, hep) {
  const CHILDLIST = 1;
  const ATTRIBUTE = 2;
  const CHARACTERDATA = 3;
  const ADD = 1;
  const REMOVE = -1;

  const _observeDom = function(type, searchTerm, addOrRemove) {
    const htmlElement = this;
    return new Promise((resolve, reject) => {
      if (
        !_isCSSSelector(searchTerm) &&
        !_isRegularExpression(searchTerm) &&
        !_isAttributeMap(searchTerm)
      ) {
        reject(
          new Error(
            'SearchTerm is not valid CSS selector, Regular Expression or Map'
          )
        );
      }
      const config = {
        subtree: true,
        childList: type === CHILDLIST,
        characterDataOldValue: type === CHARACTERDATA,
        attributeOldValue: type === ATTRIBUTE,
      };

      if (type === ATTRIBUTE) {
        if (_isAttributeMap(searchTerm)) {
          config.attributeFilter = Array.from(searchTerm.keys());
        } else {
          reject(
            new Error('You can only use Map to observe attribute chanage')
          );
        }
      }

      if (type === CHARACTERDATA) {
        if (_isRegularExpression(searchTerm)) {
          reject(
            new Error(
              'You can only use regular expression to observe characterdata change'
            )
          );
        }
      }

      const observer = new MutationObserver(mutationRecords => {
        let childNodes = [];
        let reducer;

        switch (type * addOrRemove) {
          case 1:
            reducer = _addChildListReducer;
            break;
          case 2:
            reducer = _addAttributeReducer;
            break;
          case 3:
            reducer = _addCharacterDataReducer;
            break;
          case -1:
            reducer = _removeChildListReducer;
            break;
          case -2:
            reducer = _removeAttributeReducer;
            break;
          case -3:
            reducer = _removeChracterDataReducer;
            break;
          default:
            reject(new Error(`type * addOrRemove = ${type * addOrRemove}`));
        }

        childNodes = mutationRecords.reduce(reducer, []);

        if (childNodes.length > 0) {
          observer.disconnect();
          resolve(childNodes);
        }
      });
      observer.observe(htmlElement, config);
    });

    function _addAttributeReducer(acc, cur) {
      const { target, attributeName, oldValue } = cur;
      if (acc.indexOf(target) === -1) {
        Array.from(searchTerm.entries()).forEach(nameValuePair => {
          const { name, value } = nameValuePair;
          if (attributeName == name) {
            const currentValue = target[name === 'class' ? 'className' : name];
            if (
              (currentValue === value || currentValue.includes(value)) &&
              oldValue != value &&
              !oldValue.includes(value)
            ) {
              acc.push(target);
            }
          }
        });
      }
      return acc;
    }

    function _addChildListReducer(acc, cur) {
      const { addedNodes } = cur;
      addedNodes.forEach(addedNode => {
        if (acc.indexOf(cur) === -1) {
          if (_isCSSSelector(searchTerm)) {
            if (addedNode.nodeType === 1) {
              if (addedNode.querySelectorAll(searchTerm)) {
                addedNode.querySelectorAll(searchTerm).forEach(node => {
                  acc.push(node);
                });
              }
              if (addedNode.matches(searchTerm)) {
                acc.push(addedNode);
              }
            }
          }
          if (_isRegularExpression(searchTerm)) {
            if (addedNode.nodeType === 3) {
              if (searchTerm.test(addedNode.textContent)) {
                acc.push(addedNode.parentNode);
              }
            }
            if (addedNode.nodeType === 1) {
              if (searchTerm.test(addedNode.innerHTML)) {
                acc.push(addedNode);
              }
            }
          }
        }
      });
      return acc;
    }

    function _removeAttributeReducer(acc, cur) {
      const { target, attributeName, oldValue } = cur;
      if (acc.indexOf(target) === -1) {
        Array.from(searchTerm.entries()).forEach(nameValuePair => {
          const { name, value } = nameValuePair;
          if (attributeName === name) {
            const currentValue = target[name === 'class' ? 'className' : name];
            if (
              (oldValue === value || oldValue.includes(value)) &&
              currentValue !== value &&
              !currentValue.includes(value)
            ) {
              acc.push(target);
            }
          }
        });
      }
      return acc;
    }

    function _removeChildListReducer(acc, cur) {
      const { removedNodes, target } = cur;
      removedNodes.forEach(removedNode => {
        if (acc.indexOf(target) === -1) {
          if (_isCSSSelector(searchTerm)) {
            if (removedNode.nodeType === 1) {
              if (
                removedNode.querySelector(searchTerm) ||
                removedNode.matches(searchTerm)
              ) {
                acc.push(target);
              }
            }
          }
          if (_isRegularExpression(searchTerm)) {
            if (removedNode.nodeType === 3) {
              if (searchTerm.test(removedNode.textContent)) {
                acc.push(target);
              }
            }
            if (removedNode.nodeType === 1) {
              if (searchTerm.test(removedNode.innerHTML)) {
                acc.push(target);
              }
            }
          }
        }
      });
      return acc;
    }

    function _addCharacterDataReducer(acc, cur) {
      const { target, oldValue } = cur;
      const currentValue = target.textContent;
      if (searchTerm.test(currentValue) && !searchTerm.test(oldValue)) {
        acc.push(target.parentNode);
      }
      return acc;
    }

    function _removeChracterDataReducer(acc, cur, idx, src) {
      const { target, oldValue } = cur;
      const currentValue = target.textContent;
      if (searchTerm.test(oldValue) && !searchTerm.test(currentValue)) {
        acc.push(target.parentNode);
      }
      return acc;
    }
  };

  function _isCSSSelector(term) {
    if (typeof term !== 'string') {
      return false;
    }
    try {
      document.querySelector(term);
      return true;
    } catch (error) {
      return false;
    }
  }

  function _isRegularExpression(term) {
    return term instanceof RegExp;
  }

  function _isAttributeMap(term) {
    return (
      term instanceof Map &&
      Array.from(term.keys()).every(n => typeof n === 'string') &&
      Array.from(term.values()).every(n => typeof n === 'string')
    );
  }

  async function _observeChildList(term, addOrRemove) {
    const nodes = await _observeDom.call(this, 1, term, addOrRemove);
    return nodes;
  }

  async function _observeAttribute(term, addOrRemove) {
    const nodes = await _observeDom.call(this, 2, term, addOrRemove);
    return nodes;
  }

  async function _observeCharacterData(term, addOrRemove) {
    const nodes = await _observeDom.call(this, 3, term, addOrRemove);
    return nodes;
  }

  const onceTextAdded = async function(term) {
    const nodes = await _observeCharacterData.call(this, term, ADD);
    return Promise.resolve(nodes);
  };

  const onTextAdded = function(term, callback) {
    const htmlElement = this;
    onceTextAdded.call(htmlElement, term).then(function handleNodes(nodes) {
      callback(nodes);
      onceTextAdded.call(htmlElement, term).then(handleNodes);
    });
  };

  const onceTextRemoved = async function(term) {
    const nodes = await _observeCharacterData.call(this, term, REMOVE);
    return Promise.resolve(nodes);
  };

  const onTextRemoved = function(term, callback) {
    const htmlElement = this;
    onceTextRemoved.call(htmlElement, term).then(function handleNodes(nodes) {
      callback(nodes);
      onceTextRemoved.call(htmlElement, term).then(handleNodes);
    });
  };

  const onceNodeInserted = async function(term) {
    const nodes = await _observeChildList.call(this, term, ADD);
    return Promise.resolve(nodes);
  };

  const onNodeInserted = function(term, callback) {
    const htmlElement = this;
    onceNodeInserted.call(htmlElement, term).then(function handleNodes(nodes) {
      callback(nodes);
      onceNodeInserted.call(htmlElement, term).then(handleNodes);
    });
  };

  const onceNodeRemoved = async function(term) {
    const nodes = await _observeChildList.call(this, term, REMOVE);
    return Promise.resolve(nodes);
  };

  const onNodeRemoved = function(term, callback) {
    const htmlElement = this;
    onceNodeRemoved.call(htmlElement, term).then(function handleNodes(nodes) {
      callback(nodes);
      onceNodeRemoved.call(htmlElement, term).then(handleNodes);
    });
  };

  const onceAttributeAdded = async function(term) {
    const nodes = await _observeAttribute.call(this, term, ADD);
    return Promise.resolve(nodes);
  };

  const onAttributeAdded = function(term, callback) {
    const htmlElement = this;
    onceAttributeAdded
      .call(htmlElement, term)
      .then(function handleNodes(nodes) {
        callback(nodes);
        onceAttributeAdded.call(htmlElement, term).then(handleNodes);
      });
  };

  const onceAttributeRemoved = async function(term) {
    const nodes = await _observeAttribute.call(this, term, REMOVE);
    return Promise.resolve(nodes);
  };

  const onAttributeRemoved = function(term, callback) {
    const htmlElement = this;
    onceAttributeRemoved
      .call(htmlElement, term)
      .then(function handleNodes(nodes) {
        callback(nodes);
        onceAttributeRemoved.call(htmlElement, term).then(handleNodes);
      });
  };

  Object.assign(hep, {
    onceNodeInserted,
    onNodeInserted,
    onceNodeRemoved,
    onNodeRemoved,
    onceAttributeAdded,
    onAttributeAdded,
    onceAttributeRemoved,
    onAttributeRemoved,
    onceTextAdded,
    onceTextRemoved,
    onTextAdded,
    onTextRemoved,
  });
})(Promise, HTMLElement.prototype);
