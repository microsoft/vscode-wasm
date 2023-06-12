{{
	const Kind = {
        tuple: 'tuple',
        list: 'list',
        option: 'option',
        result: 'result',
        handle: 'handle',
        u8: 'u8',
        u16: 'u16',
        u32: 'u32',
        u64: 'u64',
        s8: 's8',
        s16: 's16',
        s32: 's32',
        s64: 's64',
        bool: 'bool',
        char: 'char',
        string: 'string',
        float32: 'float32',
        float64: 'float64',
        noResult: 'noResult',
        identifier: 'identifier',
        name: 'name',
        id: 'id',
    	multiLineComment: 'multiLineComment',
    	multiLineCommentOneLine: 'multiLineCommentOneLine',
        singleLineComment: 'singleLineComment',
        commentBlock: 'commentBlock'
    }

	function _loc(loc) {
        return {
        	start: loc.start,
            end: loc.end
        }
    }

	function commentNode(items, text, loc) {
    	const filtered = [];
        for (const item of items) {
        	if (typeof item === 'string') {
            	continue;
            }
            filtered.push(item);
        }
        if (filtered.length === 0) {
        	return undefined;
        } else if (filtered.length === 1) {
        	return filtered[0];
        } else {
        	return {
            	kind: Kind.commentBlock,
                items: filtered,
                text: text,
                range: {
	             	start: loc.start,
    	            end: loc.end,
               }
            }
        }
    }

    function attachComments(node, ...comments) {
    	if (comments === undefined || comments.length === 0) {
        	return;
        }
		let filtered = [];
        for (const comment of comments) {
        	if (Array.isArray(comment)) {
            	throw new Error('Should not happen');
            } else if (comment === null) {
            	filtered.push(undefined);
            } else if (typeof comment === 'object') {
            	filtered.push(comment);
            } else {
            	filtered.push(undefined);
            }
        }
        let end = filtered.length - 1;
        while (end >= 0 && filtered[end] === undefined) {
        	end--;
        }
        if (end < 0) {
        	return node;
        }
        if (end < filtered.length - 1) {
        	filtered = filtered.slice(0, end + 1)
        }
        node.comments = filtered;
        return node;
    }

    function node(kind, text, loc, props, ...comments) {
    	let result = {
        	kind: kind,
            text: text,
            range: {
            	start: loc.start,
                end: loc.end,
            }
        };
        const allComments = [];
        if (typeof props === 'object' && (props.kind === Kind.multiLineComment || props.kind === Kind.multiLineCommentOneLine || props.kind === Kind.singleLineComment || props.kind === Kind.commentBlock)) {
        	allComments.push(props);
        } else if (typeof props === 'string') {
        	props = undefined;
        }
        if (comments !== undefined && comments.length > 0) {
        	allComments.push(...comments);
        }
        result = props !== undefined ? Object.assign(result, props) : result;
        if (allComments.length > 0) {
        	attachComments(result, ...allComments);
        }
        return result;
    }
}}

start =
 	// comment
	tuple
    // __

reservedWord "reserved words"
 	= 'interface'
	/ 'func'
    / 'tuple'
    / 'list'
    / 'option'
    / 'result'
    / 'borrow'
	/ baseTypes

ty "built in types"
	= baseTypes
    / tuple
    / list
    / option
    / result
    / handle
    / id

ty_item "build in type with comment"
	= c1:_ type:ty c2:_ {
    	return attachComments(type, c1, c2);
    }

tuple "tuple type"
	= 'tuple' c1:_ '<' list:tupleList '>' c2:__ {
    	return node(Kind.tuple, text(), location(), { items: list }, c1, c2);
    }

tupleList "tuple element list"
    = ty_item|.., ','|
	/ ty_item

list "element list"
	= 'list' _ '<' type:ty_item '>' {
    	return node(Kind.list, text(), location(), { type: type });
    }

option "option type"
	= 'option' _ '<' type:ty_item '>' {
    	return node(Kind.option, text(), location(), { type: type });
    }

result "result type"
	= 'result' _ '<' result:ty_item ',' error:ty_item '>' {
    	return node(Kind.result, text(), location(), { result: result, error: error });
    }
    / 'result' _ '<' result:no_result ',' error:ty_item '>' {
    	return node(Kind.result, text(), location(), { result: result, error: error });
    }
    / 'result' _ '<' error:ty_item '>' {
    	return node(Kind.result, text(), location(), { result: undefined, error: error });
    }
    / 'result' {
    	return node(Kind.result, text(), location(), { result: undefined, error: undefined });
    }

no_result "no result"
	= c1:_ '_' c2:_ {
    	return node(Kind.noResult, text(), location());
    }

handle "handle type"
	= id
    / 'borrow' _ '<' id_item '>' {
    	return node(Kind.borrow, text(), location(), { id: id });
    }

id_item
	= c0:_ id:id c1:_ {
    	return attachedComments(id, c0, c1);
    }

id "id"
	= name {
    	return node(Kind.id, text(), location());
    }

identifier "identifier"
	= name {
    	return node(Kind.identifier, text(), location());
    }

name "name"
	= !reservedWord label {
    	return node(Kind.name, text(), location());
    }
    / '%'label {
    	return node(Kind.name, text(), location());
    }

label "label"
	= reservedWord word|..,'-'| {
    	return { text: text() };
    }

word "word"
	= [a-z]i[0-9a-z]i* {
    	return text();
    }

baseTypes "base types"
	= u8 / u16 / u32 / u64
    / s8 / s16 / s32 / s64
    / float32 / float64
    / bool
    / char
    / string

u8 "u8"
	= 'u8' {
    	return node(Kind.u8, text(), location())
    }

u16 "u16"
	= 'u16' {
    	return node(Kind.u16, text(), location())
    }

u32 "u32"
	= 'u32' {
    	return node(Kind.u32, text(), location())
    }

u64 "u64"
	= 'u64' {
    	return node(Kind.u64, text(), location())
    }

s8 "s8"
	= 's8' {
    	return node(Kind.s8, text(), location())
    }

s16 "s16"
	= 's16' {
    	return node(Kind.s16, text(), location())
    }

s32 "s32"
	= 's32' {
    	return node(Kind.s32, text(), location())
    }

s64 "s64"
	= 's64' {
    	return node(Kind.s64, text(), location())
    }

float32 "float32"
	= 'float32' {
    	return node(Kind.float32, text(), location())
    }

float64 "float64"
	= 'float64' {
    	return node(Kind.float64, text(), location())
    }

bool "bool"
	= 'bool' {
    	return node(Kind.bool, text(), location())
    }

char "char"
	= 'char' {
    	return node(Kind.char, text(), location())
    }

string "string"
	= 'string' {
    	return node(Kind.string, text(), location())
    }

__ "whitespace end of line"
	= space:[ ]* comment:(singleLineComment / multiLineCommentOneLine+)? {
    	return comment;
    }

_ "whitespace with comments"
	= items:(comment / s)* {
    	return commentNode(items, text(), location());
    }

comment "comment"
	= multiLineComment
	/ singleLineComment

multiLineComment "multi line comment"
	= '/*' (!'*/' .)* '*/' {
    	return node(Kind.multiLineComment, text(), location());
    }

multiLineCommentOneLine "multi line comment on one line"
	= '/*' (!('*/' / lineTerminatorSequence) .)* '*/' {
    	return node(Kind.multiLineCommentOneLine, text(), location());
    }

singleLineComment " single line comment"
	= '//' (!lineTerminator .)* {
    	return node(Kind.singleLineComment, text(), location());
    }

lineTerminator
	= [\n\r]

lineTerminatorSequence "end of line"
	= "\n"
    / "\r"
    / "\r\n"

s "whitespace"
	= [ \t\n\r] {
    	return text()
    }