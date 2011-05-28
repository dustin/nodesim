fun({Doc}) ->
        F = fun(B) -> proplists:get_value(B, Doc) end,
        case F(<<"type">>) of
            <<"test">> ->
                Emit([F(<<"algorithm">>), F(<<"start_time">>), F(<<"_id">>)], null);
            _ -> false
        end
end.
