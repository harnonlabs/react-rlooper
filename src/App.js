import React, { useState, useEffect, useRef } from 'react'
import './App.css'

let getApiJsonResponse = [
  {
    id: '1a',
    rlClass: 'news',
    rlProps: { title: 'News One', desc: 'news one description' },
    pos: 15
  },
  {
    id: '2b',
    rlClass: 'feeder',
    rlProps: { title: 'Feeder One', desc: 'feeder one description' },
    pos: 2
  },
  {
    id: '7b',
    rlClass: 'feeder',
    rlProps: { title: 'Feeder Two', desc: 'feeder two description' },
    pos: 4
  },
  {
    id: '3c',
    rlClass: 'hero',
    rlProps: { title: 'Hero One', desc: 'hero one desc' },
    pos: 3
  },
  {
    id: '4d',
    rlClass: 'news',
    rlProps: { title: 'News Two', desc: 'news two desc' },
    pos: 10
  },
  {
    id: '5e',
    rlClass: 'news',
    rlProps: { title: 'News Three', desc: 'news three desc' },
    pos: 13
  }
]

function compareFunc({ props: { pos: a } }, { props: { pos: b } }) {
  if (a > b) return 1
  else if (a < b) return -1
  else if (a === b) return 0
}
function sortTree(tree) {
  return tree.map(rlClassBlock => {
    const { props, ...rest } = rlClassBlock
    if (rest.key) {
      return {
        ...rest,
        props: { ...props, children: props.children.sort(compareFunc) }
      }
    } else {
      return rlClassBlock
    }
  })
}

function Rlooper(props) {
  // state hooks and initial vars
  let [rlTree, setRlTree] = useState([])
  let [modeData, setModeData] = useState(true)
  let refChildrenTree = useRef([])
  let droppableCounter = 0
  let rlClonedCounter = 0

  // ModeSwitch internal component. It's just a toggler switch...
  const modeSwitch = (
    <label className="switch">
      <input type="checkbox" onClick={() => setModeData(!modeData)} />
      <span className="slider round"></span>
    </label>
  )

  //events
  const onItemMouseEnter = e => {
    // create div
    const elem = e.target.closest('[data-rlclass]')
    let newDiv = document.createElement('div')
    let btn = document.createTextNode('🎬')
    newDiv.classList.add('cloneBtn')

    // add onclick event listener
    newDiv.addEventListener('click', () => {
      const [rlClassBlock, rlClassBlockIdx, rlTreeElem] = findInRlTree(elem)
      const modifiedProps = {
        ...rlTreeElem.props,
        id: `rlcloned-${rlClonedCounter}`,
        key: `rlcloned-${rlClonedCounter}`,
        onDragStart: e => onItemDragStart(e),
        onMouseEnter: e => onItemMouseEnter(e),
        onMouseLeave: e => onItemMouseLeave(e)
      }
      rlClonedCounter++
      modifiedProps.pos++

      const newElem = {
        ...rlTreeElem,
        props: { ...modifiedProps }
      }

      const newChildren = [...rlClassBlock.props.children]
      newChildren[newChildren.length] = newElem
      const newProps = {
        ...rlClassBlock.props,
        children: newChildren
      }
      const newRlClassBlock = {
        ...rlClassBlock,
        props: { ...newProps }
      }

      // update the ref tree
      refChildrenTree.current[rlClassBlockIdx] = newRlClassBlock
      setRlTree(sortTree(refChildrenTree.current))
    })

    // append to the rlclass elem
    newDiv.appendChild(btn)
    elem.appendChild(newDiv)
  }
  const onItemMouseLeave = e => {
    const elem = e.target.closest('[data-rlclass]')
    if (elem.querySelector('.cloneBtn')) {
      elem.removeChild(elem.querySelector('.cloneBtn'))
    }
  }
  const onItemDragStart = e => {
    const data = { id: e.target.id, rlClass: e.target.dataset.rlclass }
    e.dataTransfer.setData('text/plain', JSON.stringify(data))
  }
  const onItemDragOver = e => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  const onItemDrop = e => {
    e.preventDefault()

    // get IDs of source (drag) and target (drop) elems and rlClassName
    const dragData = JSON.parse(e.dataTransfer.getData('text/plain'))

    // if dropped in a different rlClassBlock, ignore the drop event
    if (
      !e.target.closest('.droppable-' + dragData.rlClass) ||
      !e.target.closest('[data-rlclass]')
    ) {
      return
    }

    // get IDs
    const rlClassDOMName = e.target
      .closest('.droppable-' + dragData.rlClass)
      .getAttribute('class')
    const sourceElemID = dragData.id
    const targetElemID = e.target.closest('[data-rlclass]').getAttribute('id')

    // get the rlClassBlock and from its children,
    // extract the source(drag start) and target(drop) elements
    const rlClassBlock = refChildrenTree.current.find(
      elem => elem.props.className === rlClassDOMName
    )
    const rlClassBlockIndex = refChildrenTree.current.findIndex(
      elem => elem.key === rlClassBlock.key
    )

    let sourceElem = rlClassBlock.props.children.find(
      elem => elem.props.id === sourceElemID
    )
    let targetElem = rlClassBlock.props.children.find(
      elem => elem.props.id === targetElemID
    )
    let sourceElemIdx = rlClassBlock.props.children.findIndex(
      elem => elem.props.id === sourceElemID
    )
    let targetElemIdx = rlClassBlock.props.children.findIndex(
      elem => elem.props.id === targetElemID
    )

    // update positions
    const tempSourceElem = sourceElem.props.pos

    rlClassBlock.props.children[sourceElemIdx] = {
      ...sourceElem,
      props: { ...sourceElem.props, pos: targetElem.props.pos }
    }
    rlClassBlock.props.children[targetElemIdx] = {
      ...targetElem,
      props: { ...targetElem.props, pos: tempSourceElem }
    }

    // set rlTree with the newly reordered tree
    const reorderedTree = [...refChildrenTree.current]
    reorderedTree[rlClassBlockIndex] = rlClassBlock

    // update the reference with the latest value
    refChildrenTree.current = reorderedTree

    // update the rlTree
    setRlTree(sortTree(refChildrenTree.current))
  }

  let elemOnFocus
  const onContentEditableFocus = e => {
    elemOnFocus = e.target.textContent
  }
  const onContentEditableBlur = e => {
    // if there is no changes, then skip...
    if (elemOnFocus === e.target.textContent) {
      return
    }

    // find in ref the rlClassBlock and its index
    const [rlClassBlock, rlClassBlockIdx] = findInRlTree(
      e.target.closest('[data-rlclass]')
    )

    // find in ref the parent element (rlClass element) and the prop element
    // (the prop holding the value). Also its indexes in the arrays
    const propParentElem = {
      ...rlClassBlock.props.children.find(
        prop => prop.props.id === e.target.parentElement.getAttribute('id')
      )
    }
    const propParentElemIdx = rlClassBlock.props.children.findIndex(
      prop => prop.props.id === e.target.parentElement.getAttribute('id')
    )

    const propElem = {
      ...propParentElem.props.children.find(
        prop => prop.props['data-rlprop'] === e.target.dataset.rlprop
      )
    }
    const propElemIdx = propParentElem.props.children.findIndex(
      prop => prop.props['data-rlprop'] === e.target.dataset.rlprop
    )

    // build the new object that will totally replace the rlClass element
    const propElemModified = {
      ...propElem,
      props: {
        ...propElem.props,
        children: e.target.textContent
      }
    }
    // build the new children
    const newChildren = [...propParentElem.props.children]
    newChildren[propElemIdx] = propElemModified
    //compose the final element
    const finalElem = {
      ...propParentElem,
      props: {
        ...propParentElem.props,
        rlModified: true,
        children: newChildren
      }
    }

    // update the ref with the new rlClass element
    refChildrenTree.current[rlClassBlockIdx].props.children[
      propParentElemIdx
    ] = { ...finalElem }

    // update rlTree
    setRlTree(refChildrenTree.current)
  }

  // function to update persisted data (api, etc...)
  function update(data) {
    data.forEach(dataElem => {
      let idx = getApiJsonResponse.findIndex(elem => elem.id === dataElem[0])
      getApiJsonResponse[idx] = {
        ...getApiJsonResponse[idx],
        rlProps: { ...dataElem[1] }
      }
    })
  }

  // helper functions
  function saveToApi() {
    // FOR UPDATED ELEMS

    // find all elems with rlModified prop
    let updatedElems = []
    rlTree.forEach(elem => {
      const foundElem = elem.props.children.filter(
        propElem => propElem.props.rlModified
      )
      if (foundElem.length) {
        updatedElems = [...updatedElems, ...foundElem]
      }
    })

    // send all modified props
    const updateData = updatedElems.map(elem => {
      const id = elem.props.id
      const props = elem.props.children
        .filter(propElem => propElem.props['data-rlprop'])
        .reduce(
          (acc, cur) => ({
            ...acc,
            [cur.props['data-rlprop']]: cur.props.children
          }),
          {}
        )
      return [id, props]
    })

    // update the persisted storage
    update(updateData)

    // FOR NEW ELEMS
    const newElems = []
    rlTree.forEach(elem => {
      const clonedElems = elem.props.children.filter(e =>
        e.props.id ? e.props.id.startsWith('rlcloned') : false
      )
      if (clonedElems) {
        newElems.push(clonedElems)
      }
    })

    const getProps = props => {
      return props
        .filter(prop => prop.props['data-rlprop'])
        .reduce((acc, cur) => {
          return { ...acc, [cur.props['data-rlprop']]: cur.props.children }
        }, {})
    }

    const finalElems = newElems.flat().map(elem => {
      return {
        id: elem.props.id,
        rlClass: elem.props['data-rlclass'],
        rlProps: getProps(elem.props.children),
        pos: elem.props.pos
      }
    })

    // save to api
    getApiJsonResponse = [...getApiJsonResponse, ...finalElems]
  }
  function findInRlTree(target) {
    const rlClassBlockName = target.parentElement.getAttribute('class')
    const rlClassBlock = refChildrenTree.current.find(
      elem => elem.props.className === rlClassBlockName
    )
    const rlClassBlockIdx = refChildrenTree.current.findIndex(
      elem => elem.props.className === rlClassBlockName
    )
    const selectedElem = rlClassBlock.props.children.find(
      elem => elem.props.id === target.getAttribute('id')
    )

    return [rlClassBlock, rlClassBlockIdx, selectedElem]
  }
  function createRlComponent({ props: rlClassChildren, ...rlClass }) {
    // let's render all apiJsonResponse ocurrences of the same rlClass

    // we will create a counter for the keys
    let keyIdx = 0

    // FROM THE COMPONENT: get me the rlClassName of this rlClass and its children (props)
    const {
      'data-rlclass': rlClassName,
      children: rlClassProps,
      ...rest
    } = rlClassChildren

    // FROM THE APIJSONRESPONSE: bring me all ocurrences for this particular rlClass
    let rlClassData = getApiJsonResponse.filter(
      data => data.rlClass === rlClassName
    )

    // FOR EACH JSONAPIRESPONSE PROP
    let rlClasses = rlClassData.map(data => {
      let modifiedChildrenProps = rlClassProps.map(rlClassProp => {
        let { 'data-rlprop': rlPropName } = rlClassProp.props
        if (rlPropName) {
          let modifiedProps = {
            'data-rlprop': rlPropName,
            children: data.rlProps[rlPropName],
            contentEditable: true,
            onFocus: e => onContentEditableFocus(e),
            onBlur: e => onContentEditableBlur(e)
          }
          return { ...rlClassProp, props: modifiedProps }
        } else {
          return rlClassProp
        }
      })

      // set the modified props
      let modifiedRlClassProps = {
        'data-rlclass': rlClassName,
        key: `${rlClassName}-${keyIdx}`,
        className: `${rlClassName} cloneBtnWrapper`,
        children: modifiedChildrenProps,
        pos: data.pos,
        id: data.id,
        draggable: true,
        onDragStart: e => onItemDragStart(e),
        onMouseEnter: e => onItemMouseEnter(e),
        onMouseLeave: e => onItemMouseLeave(e),
        ...rest
      }

      // increment the key index
      keyIdx++

      // return the object that represents the modified component
      return { ...rlClass, props: modifiedRlClassProps }
    })

    droppableCounter++

    return (
      <div
        key={`dropkey-${droppableCounter}`}
        className={`droppable-${rlClassName}`}
      >
        {rlClasses}
      </div>
    )
  }

  useEffect(() => {
    // we will store here all virtual on-the-fly components called rlComponents
    const rlComponents = {}

    // filter only the children with rlClass attr and add it to rlComponents
    const rlClasses = props.children.filter(ch => ch['props']['data-rlclass'])
    rlClasses.forEach(
      rlClass => (rlComponents[rlClass.props['data-rlclass']] = rlClass)
    )

    // for each dom child, validates if belongs to a rlClass and create the
    // component. Otherwise return the same child
    const tree = props.children.map(child => {
      return child.props['data-rlclass'] ? createRlComponent(child) : child
    })

    // it basically adds onDrop and onDragOver events
    refChildrenTree.current = tree.map(({ props, ...rest }) => {
      if (!rest.key) return { ...rest, props: { ...props } }
      const modifiedProps = {
        ...props,
        onDrop: e => onItemDrop(e),
        onDragOver: e => onItemDragOver(e)
      }
      return { ...rest, props: { ...modifiedProps } }
    })
  }, [])

  useEffect(() => {
    setRlTree(sortTree(refChildrenTree.current))
  }, [refChildrenTree])

  // if modeDate enabled, show all data coming from the storage (api, db, etc...),
  // combined with the components (a.k.a rlTree). otherwise render the
  // default mode (components view)
  return modeData ? (
    <div className="rlTree">
      {modeSwitch}
      <button onClick={saveToApi}>Save</button>
      {rlTree}
    </div>
  ) : (
    <div className="rlTree">
      {modeSwitch} {props.children}
    </div>
  )
}

function App() {
  return (
    <Rlooper>
      <div
        data-rlclass="news"
        style={{ backgroundColor: 'red', margin: '1rem' }}
      >
        <div data-rlprop="title">Title</div>
        <div>Gatos!</div>
        <div data-rlprop="desc">Desc</div>
      </div>
      <div style={{ backgroundColor: 'lightblue', margin: '1rem' }}>
        <div>Aqui no</div>
        <div data-rlprop="desc">Desc</div>
      </div>
      <div
        data-rlclass="feeder"
        style={{ backgroundColor: 'tomato', margin: '1rem' }}
      >
        <div data-rlprop="title">Title</div>
        <div data-rlprop="desc">Desc</div>
      </div>
      <div
        data-rlclass="hero"
        style={{ backgroundColor: 'cyan', margin: '1rem' }}
      >
        <div data-rlprop="title">Title</div>
        <div data-rlprop="desc">Desc</div>
      </div>
    </Rlooper>
  )
}

export default App
