```typescript
defineScene({
  config,
  variables: {
    _test: 0
  }
})({ label, goto, next, call, condition }) => [

  { type: 'dialogue', text: 'say something' },

  label('start'),
  condition(
    // condition
    ({ _test }) => test === 0,
    // if
    [
      label('loop'),
      { type: 'dialogue', speaker: 'narrator', text: '당신은 루프에 갇혔다.' },
    
      condition(({ _test }) => _test > 3, [
        { type: 'dialogue', speaker: '후미카', text: '...' },
        { type: 'dialogue', speaker: '후미카', text: '...' },

        call('sub-scene', { preserve: true, restore: false }),

        goto('escape'),
      ]),

      goto('loop'),
    ],
    // else
    [
      ...
    ]
  ),

  label('escape'),

  { type: 'dialogue', text: 'say something' },

  goto('start')

  next('another-scene')
])
```
