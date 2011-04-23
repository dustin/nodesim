fun({Doc}) ->
        F = fun(B) -> proplists:get_value(B, Doc) end,
        case proplists:is_defined(<<"n_alive_nodes">>, Doc) of
            true ->
                Emit([F(<<"test">>), F(<<"n_dead_nodes">>), length(F(<<"missing">>))],
                     {[{<<"failed">>, F(<<"failed">>)},
                       {<<"missing">>, F(<<"missing">>)}]});
            _ -> false
        end
end.
