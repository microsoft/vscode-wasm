start =
	__ builtInType __

comment "comment"
	= multiLineComment
	/ singleLineComment

multiLineComment "multi line comment"
	= '/*' (!'*/' .)* '*/' {
    	return { kind: 'multiLineComment', text: text() }
    }

singleLineComment " single line comment"
	= '//' (!lineTerminator .)* {
    	return { kind: 'lineComment', text: text() }
    }

keyword "keyword"
 	= interface
	/ func

interface = 'interface'
func = 'func'

builtInType "base types"
	= 'u8' / 'u16' / 'u32' / 'u64'
    / 's8' / 's16' / 's32' / 's64'
    / 'float32' / 'float64'
    / 'char'
    / 'bool'
    / 'string'
    / tuple
    / list
    / option
    / result
    / handle
    / id

tuple "tuple type"
	= 'tuple' __ '<' __ tupleList __ '>'

tupleList "tuple element list"
    = builtInType|.., __ ',' __ |
	/ builtInType

list "element list"
	= 'list' __ '<' __ builtInType __ '>'

option "option type"
	= 'option' __ '<' __ builtInType __ '>'

result "result type"
	= 'result' __ '<' __ builtInType __ ',' __ builtInType __ '>'
    / 'result' __ '<' __ '_' __ ',' __ builtInType __ '>'
    / 'result' __ '<' __ builtInType __ '>'
    / 'result'

handle "handle type"
	= id
    / 'borrow' __ '<' __ id __ '>'

id "identifier"
	= word

lineTerminator
	= [\n\r]

lineTerminatorSequence "end of line"
	= "\n"
    / "\r"
    / "\r\n"

__ "whitespace with comments"
	= _

_ "whitespace"
	= [ \t\n\r]*

list2 = elements:word|.., _ "," _ | { return elements.join("|") }

word = $[a-z]i+